<?php
include('../database/connection.php');
include('../models/Order.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

$pdo = getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$inputData = json_decode(file_get_contents("php://input"), true);

if ($method == 'GET') {
    if (isset($_GET['id'])) {
        $order = new Order();
        $result = $order->getOrderById($pdo, $_GET['id']);
    } else {
        $result = Order::getAllOrders($pdo);
    }

    echo json_encode(["status" => "success", "data" => $result]);
    exit;
}

if ($method == 'POST') {
    try {
        $order = new Order(
            $inputData['status_id'],
            $inputData['client_id'],
            $inputData['employee_id'],
            $inputData['description'],
            $inputData['estimated_value'],
            $inputData['discount'],
            $inputData['expected_delivery_date'],
            $inputData['notes'],
            $inputData['origin_id']
        );

        $id = $order->store($pdo);
        
        echo json_encode(["status" => "success", "message" => "Pedido criado com sucesso!", "id" => $id]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao criar pedido: " . $e->getMessage()]);
    }
    exit;
}

if ($method == 'PUT') {
    if (!isset($_GET['id'])) {
        echo json_encode(["status" => "error", "message" => "ID do pedido é obrigatório."]);
        exit;
    }

    try {
        $order = new Order(
            $inputData['status_id'],
            $inputData['client_id'],
            $inputData['employee_id'],
            $inputData['description'],
            $inputData['estimated_value'],
            $inputData['discount'],
            $inputData['expected_delivery_date'],
            $inputData['notes'],
            $inputData['origin_id']
        );

        $updated = $order->update($pdo, $_GET['id']);
        
        if ($updated) {
            echo json_encode(["status" => "success", "message" => "Pedido atualizado com sucesso!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Falha ao atualizar pedido."]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao atualizar pedido: " . $e->getMessage()]);
    }
    exit;
}

if ($method == 'DELETE') {
    if (!isset($_GET['id'])) {
        echo json_encode(["status" => "error", "message" => "ID do pedido é obrigatório."]);
        exit;
    }

    try {
        $order = new Order();
        $deleted = $order->delete($pdo, $_GET['id']);

        if ($deleted) {
            echo json_encode(["status" => "success", "message" => "Pedido excluído com sucesso!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Falha ao excluir pedido."]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Erro ao excluir pedido: " . $e->getMessage()]);
    }
    exit;
}

echo json_encode(["status" => "error", "message" => "Método não permitido."]);
exit;
