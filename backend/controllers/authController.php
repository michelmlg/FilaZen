<?php
include('../database/connection.php');
include('../models/Auth.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

$inputData = json_decode(file_get_contents("php://input"), true);

if($method == 'GET'){
    echo json_encode(Auth::getSession());
}

if ($method == 'POST' && $inputData['method'] == 'username') {
    try {
        $pdo = getConnection();
        
        $username = $inputData['username'];
        $password = $inputData['password'];

        $is_logged = Auth::loginWithUsername($pdo, $username, $password);

        if($is_logged){
            echo json_encode(["status" => "success", "message" => "Entrou com sucesso!"]);
        }else{
            echo json_encode(["status" => "error", "message" => "O usuário ou a senha estão errados!"]);
        }

    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao autenticar usuário: " . $e->getMessage()]);
    } finally {
        $pdo = null; // Fecha a conexão
    }
    exit;
}

if ($method == 'POST' && $inputData['method'] == 'email') {
    try {
        $pdo = getConnection();
        
        $email = $inputData['email'];
        $password = $inputData['password'];

        $is_logged = Auth::loginWithEmail($pdo, $email, $password);

        if($is_logged){
            echo json_encode(["status" => "success", "message" => "Entrou com sucesso!"]);
        }else{
            echo json_encode(["status" => "error", "message" => "O email ou a senha estão errados!"]);
        }

    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao autenticar usuário: " . $e->getMessage()]);
    } finally {
        $pdo = null; // Fecha a conexão
    }
    exit;
}

if($method == 'DELETE'){
    try{
        Auth::logout();
    
        echo json_encode(["status" => "success", "message" => "Usuário deslogado com sucesso."]);
    }catch(Exception $e){
        echo json_encode(["status" => "error", "message" => "Erro ao deslogar usuário: " . $e->getMessage()]);
    }
}





