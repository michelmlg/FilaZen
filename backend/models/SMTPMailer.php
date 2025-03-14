<?php

class SMTPMailer {
    private static string $apiUrl = getenv('KINGHOST_SMTP_ADDRESS');
    private static string $apiToken;

    public static function init(): void {
        self::$apiToken = getenv('KINHOST_SMTP_API_TOKEN');
        if (!self::$apiToken) {
            throw new Exception("Token da API não definido. Configure a variável de ambiente KINHOST_SMTP_API_TOKEN.");
        }
    }

    public static function sendEmail(string $to, string $from, string $subject, string $body, array $headers = []): bool {
        self::init();

        $payload = [
            "subject" => $subject,
            "body" => $body,
            "to" => $to,
            "from" => $from,
            "headers" => array_merge(["Content-Type" => "text/plain; charset=UTF-8"], $headers)
        ];

        $ch = curl_init(self::$apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "accept: application/json",
            "Content-Type: application/json",
            "x-auth-token: " . self::$apiToken
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            return true;
        } else {
            error_log("Erro ao enviar e-mail: " . $response);
            return false;
        }
    }
}

// Exemplo de uso:

// require_once 'SMTPMailer.php';

// $to = "destinatario@example.com";
// $from = "remetente@example.com";
// $subject = "Assunto do e-mail";
// $body = "Aqui vai a mensagem";

// if (SMTPMailer::sendEmail($to, $from, $subject, $body)) {
//     echo "E-mail enviado com sucesso!";
// } else {
//     echo "Falha ao enviar o e-mail.";
// }

