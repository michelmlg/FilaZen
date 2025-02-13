<?php

include('../database/connection.php');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Content-Type: application/json");

// Captura o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

$inputData = json_decode(file_get_contents("php://input"), true);


if($_SERVER['REQUEST_METHOD'] == 'GET'){


}

if($_SERVER['REQUEST_METHOD'] == 'POST'){

    
}

?>