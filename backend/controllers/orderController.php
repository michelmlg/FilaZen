<?php
include('../database/connection.php');
include('../models/Order.php');

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

if(!$_SESSION){
    echo json_encode(["status" => "error", "message" => "Essa rota é protegida, faça login para acessá-la."]);
    exit;
}


if ($method == 'GET') {
    try {
        $pdo = getConnection();
        
        // Fetch all order statuses
        if (isset($_GET['getStatus']) && $_GET['getStatus'] === 'true') {
            $status_list = Order::getAllOrderStatuses($pdo);
            echo json_encode([
                "status" => "success", 
                "status_list" => $status_list
            ]);
        }
        // Fetch all order origins
        else if (isset($_GET['getOrigin']) && $_GET['getOrigin'] === 'true') {
            $origin_list = Order::getAllOrderOrigins($pdo);
            echo json_encode([
                "status" => "success", 
                "origin_list" => $origin_list
            ]);
        }
        // Default: fetch all orders
        else {
            $orders = Order::getAllOrders($pdo);
            echo json_encode(["status" => "success", "data" => $orders]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao processar requisição: " . $e->getMessage()]);
    } finally {
        $pdo = null;
    }
    exit;
}

if ($method == 'POST') {
    try {
        $pdo = getConnection();
        
        if (!isset($inputData['status_id'], $inputData['client_id'], 
                  $inputData['employee_id'], $inputData['description'], 
                  $inputData['origin_id'])) {
            echo json_encode([
                "status" => "error", 
                "message" => "Campos obrigatórios ausentes", 
                "campos" => $inputData
            ]);
            exit;
        }

        $estimated_value = $inputData['estimated_value'] ?? 0.00;
        $discount = $inputData['discount'] ?? 0.00;
        $expected_delivery_date = $inputData['expected_delivery_date'] ?? null;
        $notes = $inputData['notes'] ?? null;

        $order = new Order(
            $inputData['status_id'],
            $inputData['client_id'],
            $inputData['employee_id'],
            $inputData['description'],
            $inputData['origin_id'],
            $estimated_value,
            $discount,
            $expected_delivery_date,
            $notes
        );
        
        $id = $order->store($pdo);

        if($id) {
            echo json_encode([
                "status" => "success", 
                "message" => "Pedido criado com sucesso!", 
                "id" => $id
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Erro ao inserir pedido"
            ]);
        }
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error", 
            "message" => "Erro ao criar pedido: " . $e->getMessage()
        ]);
    } finally {
        $pdo = null;
    }
    exit;
}

