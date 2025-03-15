<?php
include('../database/connection.php');
include_once('../models/User.php');
include_once('../models/Auth.php');
include_once('../SMTPMailer.php');


header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

// Captura o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

$inputData = json_decode(file_get_contents("php://input"), true) ?? $_POST;

if(!Auth::getSession()){
    echo json_encode(["status" => "error", "message" => "Essa rota é protegida, faça login para acessá-la."]);
    exit;
}

if ($method == 'GET') {
    try {
        $pdo = getConnection();

        $users = User::getAllUsers($pdo);

        if($user.count() == 0) {
            echo json_encode(["status" => "success", "data" => $users]);
            exit;
        }else{ 
            echo json_encode(["status" => "success", "message" => "Nenhum usuário encontrado"]);
            exit;
        }
    
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao buscar usuários: " . $e->getMessage()]);
    } finally {
        $pdo = null; 
    }
    exit;
}

if ($method == 'POST') {
    try {
        $pdo = getConnection();
        
        if (!isset($inputData['username'],$inputData['email'] ,$inputData['full_name'], $inputData['password'])) {
            echo json_encode(["status" => "error", "message" => "Campos obrigatórios ausentes", "campos" => $inputData]);
            exit;
        }

        $username = trim($inputData['username']);
        $email = trim($inputData['email']);
        $full_name = trim($inputData['full_name']);
        $password = trim($inputData['password']);

        $user = new User($username, $email, $full_name, $password);
        
        $id = $user->store($pdo);

        if($id) {
            echo json_encode(["status" => "success", "message" => "Usuário criado com sucesso!", "id" => $id]);
        } else {
            echo json_encode(["status" => "error", "message" => "Erro ao inserir usuário"]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao criar usuário: " . $e->getMessage()]);
    } finally {
        $pdo = null; 
    }
    exit;
}






?>
