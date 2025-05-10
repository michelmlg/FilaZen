<?php

require_once __DIR__ . '../../../vendor/autoload.php';
use Filazen\Backend\database\db;
use Filazen\Backend\models\Auth;
use Filazen\Backend\models\Client;
use Filazen\Backend\models\Order;

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Suporte para `X-HTTP-Method-Override` e `$_POST['_method']`
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

try {
    $pdo = db::getConnection();

    if ($method == 'GET') {

        if(isset($_GET['client-id'])) {
            
            $response = ["status" => "success"];
            $clientId = $_GET['client-id'];
            $client = Client::findById($pdo, $clientId);
        
            if ($client) {
                $response['client'] = $client->toAssociativeArray();
            } else {
                http_response_code(400);
                $response = [
                    "status" => "success",         
                    "message" => "Cliente não encontrado."
                ];
            }

            if(isset($_GET['order-history'])){
                $clientId = $_GET['client-id'];
                $orders = Order::findByClientId($pdo, $clientId);
                if ($orders) {
                    $response['orders'] = $orders;
                } else {
                    $response['orders'] = [];
                }
            }

            echo json_encode($response);
            exit;
        }
        
        
        else{
            $limit = $_GET['limit'] ?? 10;
            $page = $_GET['page'] ?? 1;
            $search = $_GET['search'] ?? null;
    
            $clients = Client::getAllClientsList($pdo, $limit, $page, $search);
            
            foreach($clients as $key => $client) {
                $clients[$key]['phones'] = Client::getAllPhoneNumbers($pdo, $client['id']);
            }
            
            $totalPages = Client::getTotalPages($pdo, $limit, $search);
    
            if (count($clients) == 0) {
                echo json_encode(["status" => "success", "message" => "Nenhum cliente encontrado"]);
                exit;
            }
    
            echo json_encode(["status" => "success", "clients" => $clients, "totalPages" => $totalPages]);
        }

    }

    if ($method == 'POST') {
        $cpf = $inputData['cpf'] ?? '';
        $name = $inputData['name'] ?? '';
        $email = $inputData['email'] ?? '';
        $phones = $inputData['phones'] ?? [];

        if (!$cpf || !$name || !$email) {
            throw new Exception("CPF, nome e e-mail são obrigatórios.");
        }

        $client = new Client(null, $cpf, $name, $email, null, []);
        if ($client->store($pdo)) {
            foreach ($phones as $phone) {
                $client->addCellphoneNumber($pdo, $phone);
            }
            echo json_encode(["status" => "success", "message" => "Cliente cadastrado com sucesso."]);
        } else {
            throw new Exception("Erro ao cadastrar cliente.");
        }
    }

    if ($method == 'PUT') {

        if(isset($inputData['action']) && $inputData['action'] == 'updateField') {
            $clientId = $inputData['client_id'] ?? 0;
            $field = $inputData['field'] ?? null;
            $value = $inputData['value'] ?? null;
    
            if (!$clientId || !$field || !$value) {
                throw new Exception("ID do cliente, campo e valor são obrigatórios.");
            }
    
            if (Client::updateField($pdo, $clientId, $field, $value)) {
                echo json_encode(["status" => "success", "message" => "Campo atualizado com sucesso."]);
            } 
            else {
                throw new Exception("Erro ao atualizar campo.");
            }
        }
        
        if(isset($inputData['action']) && $inputData['action'] == "updateCellphoneNumber") {
            $cellphoneId = $inputData['phone_id'] ?? 0;
            $newCellphoneNumber = $inputData['phone_number'] ?? null;
    
            if (!$cellphoneId || !$newCellphoneNumber) {
                throw new Exception("ID do cliente, ID do celular e novo número são obrigatórios.");
            }
    
            if (Client::updateCellphoneNumber($pdo, $cellphoneId, $newCellphoneNumber)) {
                echo json_encode(["status" => "success", "message" => "Número de celular atualizado com sucesso."]);
            } else {
                throw new Exception("Erro ao atualizar número de celular.");
            }
        }

        if(!isset($inputData['action'])) {
            $clientId = $inputData['client_id'] ?? 0;
            $cpf = $inputData['cpf'] ?? '';
            $name = $inputData['name'] ?? '';
            $email = $inputData['email'] ?? '';
            $phones = $inputData['phones'] ?? [];
    
            if (!$clientId || !$cpf || !$name || !$email) {
                throw new Exception("ID do cliente, CPF, nome e e-mail são obrigatórios." . $clientId . $cpf . $name . $email);
            }
    
            $client = new Client($clientId, $cpf, $name, $email, null, $phones);
    
            if(!$client){
                throw new Exception("Error ao instanciar cliente no controller.");	
            }
            
            if ($client->update($pdo)) {
                echo json_encode(["status" => "success", "message" => "Cliente atualizado com sucesso.", "updatedClient" => $client, "clientId" => $clientId, "cpf" => $cpf, "name" => $name, "email" => $email, "phones" => $phones]);
            } else {
                throw new Exception("Erro ao atualizar cliente.");
            }
        }


    }

    if ($method == 'DELETE') {
        $clientId = $inputData['client_id'] ?? 0;
        if (!$clientId) {
            throw new Exception("ID do cliente é obrigatório.");
        }

        if (Client::delete($pdo, $clientId)) {
            echo json_encode(["status" => "success", "message" => "Cliente deletado com sucesso."]);
        } else {
            throw new Exception("Erro ao deletar cliente.");
        }
    }

    if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'])) {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Método não permitido."]);
        exit;
    }

} catch (Exception | PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} finally {
    $pdo = null;
}
