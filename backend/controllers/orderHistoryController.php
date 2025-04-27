<?php
require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\models\Auth;
use Filazen\Backend\Database\db;

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

    $pdo = db::getConnection();

    $query = "SELECT o.id as order_id, os.name as status, c.name as client_name, oo.name as origin, u.full_name as seller_name, o.description as description, o.estimated_value, o.discount, o.created_at, o.delivery_date FROM orders as o INNER JOIN order_status as os ON o.status_id = os.id INNER JOIN order_origin as oo ON o.origin_id = oo.id INNER JOIN client c ON o.client_id = c.id INNER JOIN user u ON o.employee_id = u.id;";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if($result){
        echo json_encode(["status" => "success", "data" => $result]);
    } else {
        echo json_encode(["status" => "error", "message" => "Nenhum registro encontrado."]);
    }
}
