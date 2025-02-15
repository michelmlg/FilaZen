<?php
include('../database/connection.php');
include('../models/User.php')

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

// Captura o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

$inputData = json_decode(file_get_contents("php://input"), true);


if($method == 'GET'){
    try {
        $pdo = getConnection();
    } catch (PDOException $e) {
        header('Content-Type: application/json');
        echo json_encode(["status" => "error", "message" => "Erro ao conectar ao banco de dados: " . $e->getMessage()]);
        exit;
    }

    try {
        $users = User::getAllUsers($pdo); // Chama o método corretamente
        echo json_encode(["status" => "success", "data" => $users]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao buscar usuários: " . $e->getMessage()]);
    }
}

if($_SERVER['REQUEST_METHOD'] == 'POST'){

    
}

?>