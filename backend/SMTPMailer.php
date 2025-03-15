<?php
require_once('../../vendor/autoload.php');


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class SMTPMailer {
    public static function sendEmailZoho($remetente, $assunto, $mensagem) {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = getenv('SMTP_ZOHO'); // Servidor SMTP do Gmail
            $mail->SMTPAuth = true;
            $mail->Username = getenv('ZOHO_USER'); // Seu e-mail do Gmail
            $mail->Password = getenv('ZOHO_PASSWORD'); // Senha de App do Gmail
            $mail->SMTPSecure = getenv('ZOHO_SMTP_MODE'); // Segurança TLS
            $mail->Port = getenv('ZOHO_PORT'); // Porta SMTP do Gmail
            
            $mail->setFrom(getenv('ZOHO_USER'), 'Filazen'); 
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
            throw $e;
        }
    }
}