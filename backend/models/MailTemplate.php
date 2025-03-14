<?php
require_once('../../vendor/autoload.php');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailTemplate{
    public static function sendEmailGmail($remetente, $assunto, $mensagem) {
        $mail = new PHPMailer(true);

        try {
            // Configuração do servidor SMTP do Gmail
            $mail->isSMTP();
            $mail->Host = getenv('SMTP_ZOHO'); // Servidor SMTP do Gmail
            $mail->SMTPAuth = true;
            $mail->Username = getenv('ZOHO_USER'); // Seu e-mail do Gmail
            $mail->Password = getenv('ZOHO_PASSWORD'); // Senha de App do Gmail
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Segurança TLS
            $mail->Port = 587; // Porta SMTP do Gmail
            
            // $mail->SMTPOptions = array(
            //     'ssl' => array(
            //         'verify_peer'  => false,
            //         'verify_peer_name' => false,
            //         'allow_self_signed' => true
            //     )
            // );
 
            // Configuração do remetente e destinatário
            $mail->setFrom(getenv('GMAIL_USER'), 'Filazen'); 
            $mail->addAddress($remetente); 


            // Conteúdo do e-mail
            $mail->isHTML(true); 
            $mail->Subject = $assunto;
            $mail->Body    = $mensagem;
            $mail->AltBody = strip_tags($mensagem); // Versão alternativa em texto puro

            // Enviar e-mail
            $mail->send();
            return true;
        } catch (Exception $e) {
            return $e;
        }
    }
}