<?php
require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\Database\db;
use Filazen\Backend\SMTPMailer;
// include('../database/connection.php');
// include_once('../SMTPMailer.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
} elseif ($method == 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

$inputData = json_decode(file_get_contents("php://input"), true) ?? $_POST;

if ($method == 'GET') {
    try {
        $receiver = $_GET['receiver'] ?? null;

        if (!$receiver) {
            throw new Exception("O e-mail do destinatário é obrigatório.");
        }

        $mailer = new SMTPMailer($receiver);
        $mailer->getWelcomeEmailTemplate("http://localhost");
        $mailer->sendEmailZoho();

        echo json_encode([
            "status" => "sucesso",
            "message" => "E-mail enviado com sucesso para: " . $receiver
        ]);
        
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao processar requisição: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}

/*
$to = "destinatario@example.com";
$from = "remetente@example.com";
$subject = "Assunto do e-mail";
$body = "Aqui vai a mensagem";

if (SMTPMailer::sendEmail($to, $from, $subject, $body)) {
    echo "E-mail enviado com sucesso!";
} else {
    echo "Falha ao enviar o e-mail.";
}
*/
