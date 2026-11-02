
export const enviarEmailCnhValidada = async (
  email: string,
  nome: string
): Promise<void> => {
  const url = process.env.AZURE_FUNCTION_CNH_EMAIL_URL;
  const key = process.env.AZURE_FUNCTION_CNH_EMAIL_KEY;

  if (!url || !key) {
    throw new Error(
      "AZURE_FUNCTION_CNH_EMAIL_URL e AZURE_FUNCTION_CNH_EMAIL_KEY precisam estar configuradas."
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-functions-key": key,
    },
    body: JSON.stringify({ email, nome }),
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(
      `Falha ao solicitar envio do e-mail pela Azure Function: ${response.status} ${details}`
    );
  }
};
