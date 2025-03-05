<?php
include('../database/connection.php');
include('../models/Client.php');

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

try {
    $pdo = getConnection();

    if ($method == 'GET') {

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
        $clientId = $inputData['client_id'] ?? 0;
        $cpf = $inputData['cpf'] ?? '';
        $name = $inputData['name'] ?? '';
        $email = $inputData['email'] ?? '';
        $phones = $inputData['phones'] ?? [];

        if (!$clientId || !$cpf || !$name || !$email) {
            throw new Exception("ID do cliente, CPF, nome e e-mail são obrigatórios.");
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
} catch (Exception | PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} finally {
    $pdo = null;
}
