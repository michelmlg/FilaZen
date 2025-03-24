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
            if ($_GET['action'] === 'open_order') {
                try {
                    // Start a transaction
                    $pdo->beginTransaction();
                    
                    // Insert a placeholder row to reserve an ID
                    $stmt = $pdo->prepare("INSERT INTO orders (status_id, client_id, employee_id, description, estimated_value, discount, expected_delivery_date, notes, origin_id, created_at, updated_at)
                    VALUES (NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW())");
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
        // Fetch a specific order by ID
        else if (isset($_GET['id'])) {
            $orderId = $_GET['id'];
            $order = Order::getOrderById($pdo, $orderId);
            if ($order) {
                echo json_encode([
                    "status" => "success",
                    "order" => $order
                ]);
            } else {
                echo json_encode([
                    "status" => "error",
                    "message" => "Order not found"
                ]);
            }
            exit;
        }
        // Fetch all order statuses
        else if (isset($_GET['getStatus']) && $_GET['getStatus'] === 'true') {      
                $status_list = Order::getAllOrderStatuses($pdo);
                echo json_encode([
                    "status" => "success", 
                    "status_list" => $status_list
                    
                ]);
        }
        
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


        if(isset($inputData['setInteraction']) && $inputData['setInteraction'] === "true"){

            $order_id = $inputData['order_id'];
            $type = $inputData['type'];
            $body = $inputData['body'];
            $session = Auth::getSession();
     
            $interaction_id = Order::addInteraction($pdo, $order_id, $type, $body, $session['user_session']['id']);

            if(isset($interaction_id)){
                echo json_encode(["status" => "success", "message" => "Interaction added successfully!", "interaction_id" => $interaction_id]);
            }else{
                echo json_encode(["status" => "error", "message" => "An error occurred while adding a new interaction to the order."]);
            }
            exit;

        }else{
            // Validate required fields
            $required = ['id', 'client_id', 'status_id', 'employee_id']; // Include 'id' as required    
            foreach ($required as $field) {
                if (!isset($inputData[$field])) {
                    throw new Exception("Missing required field: $field");
                }
            }
    
                // Get the order ID from the input data
            $orderId = $inputData['id'];

            // Update the order
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

            $updated = $order->update($pdo, $orderId); // Call the update method

            if ($updated) {
                echo json_encode([
                    "status" => "success",
                    "id" => $orderId,
                    "message" => "Order updated successfully"
                ]);
            } else {
              throw new Exception("Failed to update order");
            }

        }

        

    } catch (Exception $e) {
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
    exit;
}

