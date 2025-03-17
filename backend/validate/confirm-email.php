<?php
include('../database/connection.php');
include_once('../models/User.php'); 
include_once('../SMTPMailer.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        $pdo = getConnection();
        

        if (!isset($_GET['token'])) {

            echo json_encode([ 
                "status" => "error", 
                "message" => "Token de verificação ausente"
            ]);
            exit;        }

        $token = trim($_GET['token']);


        $verification = User::verifyEmailToken($pdo, $token);

        if ($verification) {

            $result = User::confirmEmail($pdo, $token);

            $user = User::getUserByToken($pdo, $token);

            // Envia o e-mail para confirmar a conta.
            $mailer = new SMTPMailer($user['email']);
            $mailer->getWelcomeEmailTemplate();
            $mailer->sendEmailZoho();


            if ($result) {
                header("Location: /#/confirm-email");
                echo json_encode([
                    "status" => "success", 
                    "message" => "E-mail confirmado com sucesso! Redirecionando para o login."
                ]);
                exit;
            } else {
                echo json_encode([ 
                    "status" => "error", 
                    "message" => "Erro ao confirmar o e-mail"
                ]);
            }
        } else {
            echo json_encode([ 
                "status" => "error", 
                "message" => "Token de verificação inválido ou expirado"
            ]);
        }

    } catch (Exception $e) {
        echo json_encode([ 
            "status" => "error", 
            "message" => "Erro ao processar a requisição: " . $e->getMessage()
        ]);
    } finally {
        $pdo = null;
    }
    exit;
}
