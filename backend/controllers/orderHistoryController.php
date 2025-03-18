<?php
include('../database/connection.php');
include_once('../models/Auth.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

// Captura o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST' && isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'];
} elseif ($method == 'POST' && isset($_POST['_method'])) {
    $method = $_POST['_method'];
}

// Captura os dados do JSON enviado no corpo da requisição
$inputData = json_decode(file_get_contents("php://input"), true) ?? $_POST;

// Verifica se a sessão está ativa (rota protegida)
session_start();

if (!Auth::getSession()) {
    echo json_encode(["status" => "error", "message" => "Essa rota é protegida, faça login para acessá-la."]);
    exit;
}

// Processamento de requisições com base no método HTTP
if ($method == 'GET') {

    $pdo = getConnection();

    $query = "SELECT o.id as order_id, os.name as status, c.name as client_name, oo.name as origin, u.full_name as seller_name, o.description as description, o.estimated_value, o.discount, o.created_at, o.expected_delivery_date FROM orders as o INNER JOIN order_status as os ON o.status_id = os.id INNER JOIN order_origin as oo ON o.origin_id = oo.id INNER JOIN client c ON o.client_id = c.id INNER JOIN user u ON o.employee_id = u.id;";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if($result){
        echo json_encode(["status" => "success", "data" => $result]);
    } else {
        echo json_encode(["status" => "error", "message" => "Nenhum registro encontrado."]);
    }
}
if ($method == 'POST') {
    // Variáveis recebidas no corpo da requisição
    $status_id = $inputData['status_id'] ?? null;
    $client_id = $inputData['client_id'] ?? null;
    $employee_id = $inputData['employee_id'] ?? null;
    $description = $inputData['description'] ?? '';
    $origin_id = $inputData['origin_id'] ?? 1;
    $delivery_date = $inputData['delivery_date'] ?? null;

    // Verifica se os campos obrigatórios foram fornecidos
    if ($status_id && $client_id && $employee_id) {
        $query = "INSERT INTO tabela (status_id, client_id, employee_id, description, origin_id, delivery_date) 
                  VALUES (:status_id, :client_id, :employee_id, :description, :origin_id, :delivery_date)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status_id', $status_id);
        $stmt->bindParam(':client_id', $client_id);
        $stmt->bindParam(':employee_id', $employee_id);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':origin_id', $origin_id);
        $stmt->bindParam(':delivery_date', $delivery_date);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Registro criado com sucesso."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Erro ao criar o registro."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Campos obrigatórios não fornecidos."]);
    }

} 
if ($method == 'PUT') {
    // Atualização de um registro
    if (isset($inputData['id'])) {
        $id = $inputData['id'];
        $status_id = $inputData['status_id'] ?? null;
        $client_id = $inputData['client_id'] ?? null;
        $employee_id = $inputData['employee_id'] ?? null;
        $description = $inputData['description'] ?? '';
        $origin_id = $inputData['origin_id'] ?? 1;
        $delivery_date = $inputData['delivery_date'] ?? null;

        $query = "UPDATE tabela SET status_id = :status_id, client_id = :client_id, employee_id = :employee_id, description = :description, origin_id = :origin_id, delivery_date = :delivery_date WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':status_id', $status_id);
        $stmt->bindParam(':client_id', $client_id);
        $stmt->bindParam(':employee_id', $employee_id);
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':origin_id', $origin_id);
        $stmt->bindParam(':delivery_date', $delivery_date);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Registro atualizado com sucesso."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Erro ao atualizar o registro."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "ID não fornecido."]);
    }

} 
if ($method == 'DELETE') {
    // Exclusão de um registro
    if (isset($inputData['id'])) {
        $id = $inputData['id'];

        $query = "DELETE FROM tabela WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Registro excluído com sucesso."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Erro ao excluir o registro."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "ID não fornecido."]);
    }
} 
