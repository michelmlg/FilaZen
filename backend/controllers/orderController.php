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
        
        if (isset($_GET['getStatus']) && $_GET['getStatus'] === 'true') {      
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

        if (!isset($inputData['action'])) {
            echo json_encode(["status" => "error", "message" => "Ação não especificada."]);
            exit;
        }
        
        if ($inputData['action'] === 'getOrder') {
            if (!isset($inputData['order_id'])) {
                echo json_encode(["status" => "error", "message" => "ID do pedido não fornecido."]);
                exit;
            }
            
            $order = Order::findById($pdo, $inputData['order_id']);
            echo json_encode(["status" => "success", "order" => $order ?: "Pedido não encontrado."]);
            exit;
        }
        
        if ($inputData['action'] === 'getInteractions') {
            if (!isset($inputData['order_id'])) {
                echo json_encode(["status" => "error", "message" => "ID do pedido não fornecido."]);
                exit;
            }
            
            $interactions = Order::getInteractions($pdo, $inputData['order_id']);
            echo json_encode([
                "status" => "success",
                "interactions" => $interactions ?: "Esse pedido não possui interações!",
                "empty_list" => empty($interactions)
            ]);
            exit;
        }
        
        if ($inputData['action'] === 'setInteraction') {
            if (!isset($inputData['order_id'], $inputData['type'], $inputData['body'])) {
                echo json_encode([
                    "status" => "error",
                    "message" => "Dados insuficientes para adicionar interação."
                ]);
                exit;
            }
            
            $session = Auth::getSession();
            $user_id = $session['user_session']['id'];
            $interaction = null;
        
            // Adicionar interação e obter o ID da nova interação
            $interaction_id = Order::addInteraction(
                $pdo,
                $inputData['order_id'],
                $inputData['type'],
                $inputData['body'],
                $user_id
            );
        
            if ($interaction_id) {
                // Buscar a interação recém-criada
                $stmt = $pdo->prepare("
                    SELECT id, order_id, type, body, created_by, created_at 
                    FROM order_interactions 
                    WHERE id = :id
                ");
                $stmt->execute(['id' => $interaction_id]);
                $interaction = $stmt->fetch(PDO::FETCH_ASSOC);
            }
        
            echo json_encode([
                "status" => $interaction_id ? "success" : "error",
                "message" => $interaction_id ? "Interação adicionada!" : "Erro ao adicionar interação.",
                "interaction" => $interaction ?? null
            ]);
            exit;
        }
        


        if($inputData['action'] === 'createOrder'){
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

