<?php
include_once('../models/MailTemplate.php');

$message = '
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            background: #ffffff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        h2 {
            color: #333;
        }
        p {
            color: #555;
            font-size: 16px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            color: white;
            background: #007BFF;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Olá, Usuário!</h2>
        <p>Este é um e-mail de teste com formatação HTML.</p>
        <p>Clique no botão abaixo para acessar nosso site:</p>
        <a href="https://www.exemplo.com" class="button">Acessar Site</a>
    </div>
</body>
</html>';


header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
} elseif ($method == 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

$inputData = json_decode(file_get_contents("php://input"), true);

if ($method == 'GET') {
    try {
        $receiver = $_GET['receiver'] ?? null;
        
        $response = MailTemplate::sendEmailGmail(strtolower($receiver), "Contact Test", $message);


        echo json_encode(["status" => "sucesso", "message" => "mensagem: " . $response]);
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
