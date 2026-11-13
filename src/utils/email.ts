import nodemailer from 'nodemailer';

const host = process.env.BREVO_HOST || 'smtp-relay.brevo.com';
const port = Number(process.env.BREVO_PORT || 587);
const user = process.env.BREVO_USER!;
const pass = process.env.BREVO_PASS!;
const FROM_NAME  = process.env.MAIL_FROM_NAME || 'FaculRide';
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL!; // seu Gmail verificado no Brevo

// 465 = TLS direto; 587/2525 = STARTTLS
const secure = port === 465;

export const smtp = nodemailer.createTransport({
  host,
  port,
  secure,               // false para 587/2525; true só para 465
  auth: { user, pass },
  requireTLS: !secure,  // força STARTTLS em 587/2525
  connectionTimeout: 30000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
  logger: false,
  debug: false,
  tls: {
    minVersion: 'TLSv1.2',
    // Em caso de proxy/mitm, pode testar com:
    // rejectUnauthorized: false,
  }
});

export async function enviarEmailBoasVindas(destinatario: string, nome: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Bem-vindo(a) à FaculRide 🚗✨</h2>
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Seu cadastro foi realizado com sucesso!</p>
      <p>A partir de agora, você faz parte da nossa comunidade. 🚀</p>
      <p style="font-size: 0.9rem; color: #555;">
        Este é um e-mail automático, não responda.
      </p>
    </div>
  `;

  await smtp.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`, // tem que ser o Gmail verificado
    to: destinatario,
    subject: 'Bem-vindo(a) à FaculRide 🎉',
    html
  });
}

export async function enviarEmailRecuperacaoSenha(destinatario: string, token: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Recuperação de Senha 🔑</h2>
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>Use o seguinte token para redefinir sua senha:</p>
      <h3 style="color: #007BFF;">${token}</h3>
      <p style="font-size: 0.9rem; color: #555;">
        Este é um e-mail automático, não responda.
      </p>
    </div>
  `;
  await smtp.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: destinatario,
    subject: 'Recuperação de Senha 🔑',
    html
  });
}
