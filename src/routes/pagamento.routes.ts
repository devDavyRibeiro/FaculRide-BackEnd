// src/routes/pagamento.routes.ts
import { Router } from "express";
import { MercadoPagoConfig, Payment } from "mercadopago";

const router = Router();

// ====================== CONFIG MERCADO PAGO ======================
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN as string,
});
// =================================================================

// ===================== ROTA: CRIAR PAGAMENTO PIX =================
router.post(
  "/pagamento",
  // tipagem solta para evitar erros desnecessários
  async (req: any, res: any) => {
    try {
      // corpo vindo do front (Apoiadores)
      const { descricao, valor, idUsuario, idViagem } = req.body;

      // ===== validações mínimas =====
      if (!valor || Number(valor) <= 0) {
        res.status(400).json({ erro: "Valor inválido." });
        return;
      }

      const valorNumber = Number(valor);
      const desc = descricao || "Apoio ao projeto FaculRide";

      // cria cliente de pagamento do Mercado Pago
      const payment = new Payment(client);

      const result = await payment.create({
        body: {
          transaction_amount: valorNumber,
          description: desc,
          payment_method_id: "pix",
          payer: {
            email: "apoiador@faculride.com", // e-mail genérico para doação
          },
          metadata: {
            idUsuario: idUsuario ?? null,
            idViagem: idViagem ?? null,
            tipo: "apoio",
          },
        },
      });

      const pixData = (result as any).point_of_interaction?.transaction_data;

      res.status(201).json({
        idPagamento: (result as any).id,
        status: (result as any).status,
        qr_code_base64: pixData?.qr_code_base64 ?? null,
        qr_code: pixData?.qr_code ?? null,
        valor: valorNumber,
        descricao: desc,
      });
    } catch (err: any) {
      console.error(
        "⚠️ Erro ao criar pagamento PIX (detalhado):",
        JSON.stringify(err, null, 2)
      );

      const detalhe =
        err?.message ||
        err?.error?.message ||
        err?.error?.cause?.[0]?.description ||
        err?.error ||
        "Erro desconhecido ao falar com o Mercado Pago.";

      res.status(500).json({
        erro: "Erro ao criar pagamento PIX.",
        detalhe,
      });
    }
  }
);
// =================================================================

export default router;
