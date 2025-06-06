<?php
require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\database\db;

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

if(!$_SESSION){
    echo json_encode(["status" => "error", "message" => "Essa rota é protegida, faça login para acessá-la."]);
    exit;
}



switch ($method) {
    case 'GET':
        echo json_encode(["message" => "GET request recebida"]);
        break;

    case 'POST':
        echo json_encode(["message" => "POST request recebida", "data" => $inputData]);
        break;

    case 'PUT':
        echo json_encode(["message" => "PUT request recebida", "data" => $inputData]);
        break;

    case 'DELETE':
        echo json_encode(["message" => "DELETE request recebida"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método não permitido"]);
}

// ou

// Utilizar ifs 

if($_SERVER['REQUEST_METHOD'] == 'GET')
{
   
}

if($_SERVER['REQUEST_METHOD'] == 'POST')
{

}

if($_SERVER['REQUEST_METHOD'] == 'PUT')
{

}

if($_SERVER['REQUEST_METHOD'] == 'DELETE')
{
    
}