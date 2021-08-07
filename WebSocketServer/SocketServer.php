<?php
    //this class will spin up an instance of a Socket Server on port 8080
    use Ratchet\Server\IoServer;
    use Ratchet\Http\HttpServer;
    use Ratchet\WebSocket\WsServer;
    require_once('ServerSocketHandling.php');
    use WebSocketServer\ServerSocketHandling;

    require dirname(__DIR__) . '/server/vendor/autoload.php';

    $server = IoServer::factory (
        new HttpServer(
            new WsServer(
                new ServerSocketHandling()
            )), 8080
        );
    $server->run();
?>