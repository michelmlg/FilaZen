<?php
namespace Filazen\Backend;

public static function vSessao(){
    if (!empty($_SESSION)) {
        echo '<h2>Variáveis de Sessão</h2>';
        echo '<ul>'; // Começa uma lista não ordenada
        foreach ($_SESSION as $key => $value) {
            // Verifica se o valor é um array ou um objeto
            if (is_array($value) || is_object($value)) {
                // Se for um array ou objeto, converte para string
                $value = json_encode($value);
            }
            echo '<li><strong>' . htmlspecialchars($key) . ':</strong> ' . htmlspecialchars($value) . '</li>';
        }
        echo '</ul>'; // Fecha a lista
    } else {
        echo 'Não há variáveis de sessão armazenadas.';
    }   
}