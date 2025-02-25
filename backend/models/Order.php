<?php

class Order {
    private $id;
    private $status_id;
    private $client_id;
    private $employee_id;
    private $descriptionid;
    private $estimated_value;
    private $discount;
    private $expected_delivery_date;
    private $notes;
    private $origin_id;
    private $created_at;
    private $updated_at;

    public function __construct($status_id = null,
                                $client_id = null,
                                $employee_id = null,
                                $description = null, 
                                $estimated_value = null,
                                $discount = null,
                                $expected_delivery_date = null, 
                                $notes = null,
                                $origin_id = null){
        $this->status_id = $status_id;
        $this->client_id = $client_id;
        $this->employee_id = $employee_id;
        $this->description = $description;
        $this->estimated_value = $estimated_value;
        $this->discount = $discount;
        $this->expected_delivery_date = $expected_delivery_date;
        $this->notes = $notes;
        $this->origin_id = $origin_id;
    }
    

    public static function getAllOrders($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM orders");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function getOrderById($pdo, $id) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return false;
        }
    }

    public function store($pdo)
    {
        try {
            
            $pdo->beginTransaction();

            $sql = "INSERT INTO orders (
                status_id, client_id, employee_id, description, estimated_value, 
                discount, expected_delivery_date, notes, origin_id, created_at, updated_at
            ) VALUES (
                :status_id, :client_id, :employee_id, :description, :estimated_value, 
                :discount, :expected_delivery_date, :notes, :origin_id, NOW(), NOW()
            )";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':status_id', $this->status_id, PDO::PARAM_INT);
            $stmt->bindParam(':client_id', $this->client_id, PDO::PARAM_INT);
            $stmt->bindParam(':employee_id', $this->employee_id, PDO::PARAM_INT);
            $stmt->bindParam(':description', $this->description, PDO::PARAM_STR);
            $stmt->bindParam(':estimated_value', $this->estimated_value, PDO::PARAM_STR);
            $stmt->bindParam(':discount', $this->discount, PDO::PARAM_STR);
            $stmt->bindParam(':expected_delivery_date', $this->expected_delivery_date, PDO::PARAM_STR);
            $stmt->bindParam(':notes', $this->notes, PDO::PARAM_STR);
            $stmt->bindParam(':origin_id', $this->origin_id, PDO::PARAM_INT);

            $stmt->execute();
            $orderId = $pdo->lastInsertId(); 

            $pdo->commit();

            return $orderId;
        } catch (PDOException $e) {
            $pdo->rollBack();
            return false;
        }
    }
    public function update($pdo, $id) {
        try {
            $sql = "UPDATE orders SET status_id = :status_id, client_id = :client_id, employee_id = :employee_id, description = :description, estimated_value = :estimated_value, 
                    discount = :discount, expected_delivery_date = :expected_delivery_date, notes = :notes, origin_id = :origin_id, updated_at = NOW() WHERE id = :id";

            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->bindParam(':status_id', $this->status_id, PDO::PARAM_INT);
            $stmt->bindParam(':client_id', $this->client_id, PDO::PARAM_INT);
            $stmt->bindParam(':employee_id', $this->employee_id, PDO::PARAM_INT);
            $stmt->bindParam(':description', $this->description, PDO::PARAM_STR);
            $stmt->bindParam(':estimated_value', $this->estimated_value, PDO::PARAM_STR);
            $stmt->bindParam(':discount', $this->discount, PDO::PARAM_STR);
            $stmt->bindParam(':expected_delivery_date', $this->expected_delivery_date, PDO::PARAM_STR);
            $stmt->bindParam(':notes', $this->notes, PDO::PARAM_STR);
            $stmt->bindParam(':origin_id', $this->origin_id, PDO::PARAM_INT);
            
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }

    public function delete($pdo, $id) {
        try {
            $stmt = $pdo->prepare("DELETE FROM orders WHERE id = :id");
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
    
}
