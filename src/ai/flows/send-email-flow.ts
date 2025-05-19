
'use server';
/**
 * @fileOverview Handles sending emails.
 * - sendEmail - A function that sends an email (simulated).
 * - SendEmailInput - The input type for the sendEmail function.
 * - SendEmailOutput - The return type for the sendEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SendEmailInputSchema = z.object({
  to: z.string().email().describe('The recipient email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The HTML body of the email.'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

const SendEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A message indicating the result of the send operation.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return sendEmailFlow(input);
}

// Este flujo es una simulación. En una aplicación real, aquí se integraría
// con un servicio de envío de correos (ej. Nodemailer, SendGrid, AWS SES).
const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async ({to, subject, body}) => {
    console.log(`Simulating email send:
To: ${to}
Subject: ${subject}
Body preview: ${body.substring(0, 200)}...`);

    // Simular un pequeño retraso, como si se estuviera enviando un correo real.
    await new Promise(resolve => setTimeout(resolve, 1500));

    // En este ejemplo, siempre simularemos un envío exitoso.
    // En un caso real, manejarías errores de la API de correo aquí.
    if (to.includes("fail")) { // Simple way to test error path for simulation
        return {
            success: false,
            message: `Simulación de error: No se pudo enviar el correo a ${to}.`
        }
    }
    return {
      success: true,
      message: `Correo simulado enviado exitosamente a ${to} con asunto "${subject}".`,
    };
  }
);

