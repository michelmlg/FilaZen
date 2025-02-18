<?php
include('../database/connection.php');
include('../models/User.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

$inputData = json_decode(file_get_contents("php://input"), true);

if($method == 'GET'){
    try{
        $pdo = getConnection();

        $status_list = User::getAllStatus($pdo);

        if($status){
            echo json_encode(["status" => "success", "status_list" => $status_list]);
        }
    }catch(PDOException $e){
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro" + $e->getMessage()]);
    }finally{
        $pdo = null;
    }
    exit;
}

if($method == 'POST'){
    try{
        $pdo = getConnection();
    
        $user_id = $inputData['id'];
    
        $statusData = User::verifyStatus($pdo, $user_id);
    
        echo json_encode(["status" => "success", "id_status" => $statusData['id'], "status_name" => $statusData['name']]);
    }catch(PDOException $e){
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro ao verificar status" + $e->getMessage()])
    }
}

if ($method == 'UPDATE') {
    try{
        $user_id = $inputData['id'];
        $new_status_id = $inputData['status_id'];
    
        $pdo = getConnection();
    
        $change_status = User::changeStatus($pdo, $user_id, $new_status_id);
    
        if($change_status){
            echo json_encode(["status" => "success", "user_id" => $user_id, "new_status" => $new_status_id, "is_status_changed" => $change_status]);
        }
    }catch(PDOException $e){
        echo json_encode(["status" => "error", "message" => "Ocorreu um erro ao alterar status" + $e.getMessage()]);
    }finally{
        $pdo = null;
    }
    exit;
}
