<?php
include('../database/connection.php');
include_once('../models/Auth.php');
include_once('../models/Order.php');

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

if(!Auth::getSession()){
    echo json_encode(["status" => "error", "message" => "Essa rota é protegida, faça login para acessá-la."]);
    exit;
}


if ($method == 'GET') {
    try {
        $pdo = getConnection();
        
        // Handle different GET actions
        if (isset($_GET['action'])) {
            // Reserve an order ID action
            if ($_GET['action'] === 'reserve_id') {
                try {
                    // Start a transaction
                    $pdo->beginTransaction();
                    
                    // Insert a placeholder row to reserve an ID
                    $stmt = $pdo->prepare("INSERT INTO orders (status_id) VALUES (0)");
                    $stmt->execute();
                    
                    // Get the last inserted ID
                    $reservedId = $pdo->lastInsertId();
                    
                    // Commit the transaction
                    $pdo->commit();
                    
                    echo json_encode([
                        "status" => "success",
                        "id" => $reservedId
                    ]);
                    exit;
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    echo json_encode([
                        "status" => "error",
                        "message" => "Failed to reserve order ID: " . $e->getMessage()
                    ]);
                    exit;
                }
            }
            // Create order action
            else if ($_GET['action'] === 'create_order') {
                try {
                    // Start a transaction
                    $pdo->beginTransaction();
                    
                    // Insert a new order with default values
                    $stmt = $pdo->prepare("
                        INSERT INTO orders 
                        (status_id, created_at, updated_at) 
                        VALUES 
                        (1, NOW(), NOW())
                    ");
                    $stmt->execute();
                    
                    // Get the last inserted ID
                    $orderId = $pdo->lastInsertId();
                    
                    // Commit the transaction
                    $pdo->commit();
                    
                    echo json_encode([
                        "status" => "success",
                        "id" => $orderId
                    ]);
                    exit;
                } catch (Exception $e) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }
                    echo json_encode([
                        "status" => "error",
                        "message" => "Failed to create order: " . $e->getMessage()
                    ]);
                    exit;
                }
            }
        }
        
        // Fetch all order statuses
        else if (isset($_GET['getStatus']) && $_GET['getStatus'] === 'true') {
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

        else if (isset($_GET['getInteractions']) && $_GET['getInteractions'] === 'true') {
            $order_id = $inputData['order_id'];
            $interactions = Order::getInteractions($pdo, $order_id);

            if(count($interactions) > 0){
                echo json_encode(["status" => "success", "interactions" => $interactions]);
            }else{
                echo json_encode(["status" => "success", "interactions" => "Esse pedido não possui interações!", "empty_list" => true]);
            }
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
        $inputData = json_decode(file_get_contents("php://input"), true);
        $pdo = getConnection();

        // Validate required fields
        $required = ['client_id', 'status_id', 'employee_id'];
        foreach ($required as $field) {
            if (!isset($inputData[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }

        // Create new order
        $order = new Order(
            $inputData['status_id'],
            $inputData['client_id'],
            $inputData['employee_id'],
            $inputData['description'] ?? '',
            $inputData['origin_id'] ?? 1,
            $inputData['estimated_value'] ?? 0,
            $inputData['discount'] ?? 0,
            $inputData['delivery_date'] ?? null,
            $inputData['notes'] ?? null
        );

        $orderId = $order->store($pdo);

        if ($orderId) {
            echo json_encode([
                "status" => "success",
                "id" => $orderId,
                "message" => "Order created successfully"
            ]);
        } else {
            throw new Exception("Failed to create order");
        }
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
    exit;
}

