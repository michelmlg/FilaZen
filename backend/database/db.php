<?php
namespace Filazen\Backend\database;
use PDO;
use PDOException;

class db {
    public static function getConnection(){ 
        $host     = getenv('PMA_HOST');
        $database = getenv('MYSQL_DATABASE');
        $login_db = getenv('MYSQL_ROOT_PASSWORD');
        $senha_db = getenv('MYSQL_ROOT_PASSWORD');
        $port = getenv('MYSQL_PORT');
    
        return new PDO("mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4", "$login_db", "$senha_db");
    }
    
}

