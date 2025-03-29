<?php
require_once('../../vendor/autoload.php');


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class SMTPMailer {
    private $receiver;
    private $subject;
    private $body;

    public function __construct($receiver) {
        $this->receiver = $receiver;
        $this->subject = null;
        $this->body = null;
    }

    public function sendEmailZoho() {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = getenv('SMTP_ZOHO'); 
            $mail->SMTPAuth = true;
            $mail->Username = getenv('ZOHO_USER'); 
            $mail->Password = getenv('ZOHO_PASSWORD'); 
            $mail->SMTPSecure = getenv('ZOHO_SMTP_MODE'); 
            $mail->Port = getenv('ZOHO_PORT'); 
            $mail->CharSet = 'UTF-8';
            $mail->setFrom(getenv('ZOHO_USER'), 'Filazen'); 
            $mail->addAddress($this->receiver);

            $mail->isHTML(true); 
            $mail->Subject = $this->subject;
            $mail->Body    = $this->body;
            $mail->AltBody = strip_tags($this->body); // Corpo do e-mail em texto puro
            $mail->send();

            return true;
        } catch (Exception $e) {
            throw $e;
        }
    }

    public function getEmailTemplate($pdo, $templateName, $placeholders) {
        $stmt = $pdo->prepare("SELECT subject, body, placeholders FROM email_templates WHERE name = :name");
        $stmt->bindParam(':name', $templateName);
        $stmt->execute();
        $template = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$template) {
            throw new Exception("Template de e-mail não encontrado.");
        }

        $placeholdersDB = json_decode($template['placeholders'], true);

        if (count($placeholdersDB) !== count($placeholders)) {
            throw new Exception("Número de placeholders fornecidos não corresponde ao esperado.");
        }

        $body = $template['body'];
        foreach ($placeholdersDB as $key => $placeholder) {
            if (isset($placeholders[$key])) {
                $body = str_replace("{{" . $placeholder . "}}", $placeholders[$key], $body);
            }
        }

        $this->subject = $template['subject'];
        $this->body = $body;

        return true;
    }

    
    public function getWelcomeEmailTemplate() {
        // HTML como uma string
        $template = '
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo!</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: "Nunito", sans-serif;
                    background-color: #d3dede;
                    margin: 0;
                    padding: 0;
                    color: #08545e;
                }
                .card-header {
                    background-color: #08545e !important;
                    color: #1bb2d0 !important;
                    text-align: center;
                    font-size: 28px;
                    font-weight: bold;
                    padding: 25px;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                }
                .card-body {
                    background-color: white;
                    color: #333;
                    font-size: 18px;
                    line-height: 1.8;
                    padding: 30px;
                    border-bottom-left-radius: 10px;
                    border-bottom-right-radius: 10px;
                }
                .card {
                    border-radius: 15px;
                    box-shadow: none;
                    margin: 20px auto;
                    max-width: 600px;
                    padding: 0;
                }
                .footer {
                    margin-top: 25px;
                    font-size: 16px;
                    color: #7270db;
                    text-align: center;
                }
                .highlight {
                    font-weight: bold;
                    font-size: larger;
                    color: #08545e;
                }
                .highlight-bold {
                    font-weight: bold;
                    font-size: larger;
                    background: linear-gradient(90deg, #37be81, #08545e);
                    -webkit-background-clip: text;
                    color: transparent;
                }
                p {
                    margin-bottom: 20px;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 25px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #37be81;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                    transition: background-color 0.3s;
                }
                .btn:hover {
                    background-color: #08545e;
                }
                .text-center {
                    margin-top: 0.5rem;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="card rounded rounded-4">
                <div class="card-header">
                    Boas-vindas!
                </div>
                <div class="card-body">
                    <p>Olá, <strong>{{USERNAME}}</strong>!</p>
                    <p><strong>Estamos muito felizes</strong> por ter você conosco. Explore o <span class="highlight">FilaZen</span> e aproveite todas as funcionalidades que preparamos especialmente para você. 🎉</p>
                    <p><span class="highlight">Vamos começar</span> a sua jornada?</p>
                    <p>Não hesite em entrar em contato caso precise de qualquer ajuda. Estamos aqui para te apoiar!</p>
                </div>
            </div>
            <div class="footer">
                <p>Se precisar de ajuda, entre em contato com nossa equipe de suporte.</p>
                <p><b>filazen@zohomail.com</b></p>
            </div>
        </body>
        </html>';

        $template = str_replace("{{USERNAME}}", $this->receiver, $template);
        $this->body = $template;
        $this->subject = "Bem-vindo ao FilaZen!";

        return true;
    }

    public function getConfirmEmailTemplate($confirmUrl) {
        // HTML como uma string
        $template = '
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmar E-mail</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: "Nunito", sans-serif;
                    background-color: #d3dede;
                    margin: 0;
                    padding: 0;
                    color: #08545e;
                }
                .card-header {
                    background-color: #08545e !important;
                    color: #1bb2d0 !important;
                    text-align: center;
                    font-size: 28px;
                    font-weight: bold;
                    padding: 25px;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                }
                .card-body {
                    background-color: white;
                    color: #333;
                    font-size: 18px;
                    line-height: 1.8;
                    padding: 30px;
                    border-bottom-left-radius: 10px;
                    border-bottom-right-radius: 10px;
                }
                .card {
                    border-radius: 15px;
                    box-shadow: none;
                    margin: 20px auto;
                    max-width: 600px;
                    padding: 0;
                }
                .footer {
                    margin-top: 25px;
                    font-size: 16px;
                    color: #7270db;
                    text-align: center;
                }
                .highlight {
                    font-weight: bold;
                    font-size: larger;
                    color: #08545e;
                }
                .highlight-bold {
                    font-weight: bold;
                    font-size: larger;
                    background: linear-gradient(90deg, #37be81, #08545e);
                    -webkit-background-clip: text;
                    color: transparent;
                }
                p {
                    margin-bottom: 20px;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 25px;
                    font-size: 16px;
                    color: #fff;
                    background-color: #37be81;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                    transition: background-color 0.3s;
                }
                .btn:hover {
                    background-color: #08545e;
                }
                .text-center {
                    margin-top: 0.5rem;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="card rounded rounded-4">
                <div class="card-header">
                    Confirmação de E-mail
                </div>
                <div class="card-body">
                    <p>Olá, <strong>{{USERNAME}}</strong>!</p>
                    <p>Você acaba de se cadastrar no <span class="highlight">FilaZen</span>. Para confirmar sua conta, clique no botão abaixo:</p>
                    <p><span class="highlight">Confirme seu e-mail</span> para ativar sua conta e começar a explorar todas as funcionalidades da nossa plataforma.</p>
                    <div class="text-center">
                        <a href="{{CONFIRM_URL}}" class="btn">Confirmar E-mail</a>
                    </div>
                    <p>Se você não se inscreveu, ignore este e-mail.</p>
                </div>
            </div>
            <div class="footer">
                <p>Se precisar de ajuda, entre em contato com nossa equipe de suporte.</p>
                <p><b>filazen@zohomail.com</b></p>
            </div>
        </body>
        </html>';

        $template = str_replace("{{USERNAME}}", $this->receiver, $template);
        $template = str_replace("{{CONFIRM_URL}}", $confirmUrl, $template);
        $this->body = $template;
        $this->subject = "Confirme seu e-mail";

        return true;
    }



}