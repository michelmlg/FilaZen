<?php

class User {
    private $id;
    private $username;
    private $full_name;
    private $password;
    private $role;
    private $img_path;
    private $status;
    private $created_at;
    private $updated_at;

    public function __construct($username, $full_name, $password, $role = 'user', $img_path = null, $status = 1) {
        $this->username = $username;
        $this->full_name = $full_name;
        $this->password = password_hash($password, PASSWORD_BCRYPT);
        $this->role = $role;
        $this->img_path = $img_path;
        $this->status = $status;
        $this->created_at = date("Y-m-d H:i:s");
        $this->updated_at = date("Y-m-d H:i:s");
    }

    public function store($pdo) {
        $sql = "INSERT INTO user (username, full_name, password, role, img_path, status, created_at, updated_at) 
                VALUES (:username, :full_name, :password, :role, :img_path, :status, :created_at, :updated_at)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':img_path', $this->img_path);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':created_at', $this->created_at);
        $stmt->bindParam(':updated_at', $this->updated_at);

        if($stmt->execute()){
            return $pdo->lastInsertId();
        }else{
            return false;
        }
    }

    public function update($pdo) {
        $sql = "UPDATE user SET 
                    username = :username, 
                    full_name = :full_name, 
                    password = :password, 
                    role = :role, 
                    img_path = :img_path, 
                    status = :status, 
                    updated_at = NOW() 
                WHERE id = :id";
    
        $stmt = $pdo->prepare($sql);
        
        $stmt->bindParam(':id', $this->id);
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':role', $this->role);
        $stmt->bindParam(':img_path', $this->img_path);
        $stmt->bindParam(':status', $this->status);
    
        return $stmt->execute();
    }    
    
    public static function find($pdo, $id) {
        $sql = "SELECT * FROM user WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public static function delete($pdo, $id) {
        $sql = "DELETE FROM user WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }    

    public static function getAllUsers($pdo) {
        $sql = "SELECT * FROM user";
        $stmt = $pdo->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
}
?>
