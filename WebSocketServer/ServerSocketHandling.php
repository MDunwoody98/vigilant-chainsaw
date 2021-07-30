<?php
//Ratchet Websocket library
namespace WebSocketServer;
//Server container process is not by default in html directory
require dirname(__DIR__) . '/server/vendor/autoload.php';
//Specify Ratchet interfaces
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

//Class for Server sockets - I levereged the Ratchet library for true online multiplayer
class ServerSocketHandling implements MessageComponentInterface {
    protected $clients;
    //player 1 or 2
    public $players = array();
    public $playerIndex;

    //This method is invoked upon spinning up the docker image for the web socket server
    public function __construct()
    {
        $this->clients = new \SplObjectStorage;
        echo "Construct method invoked and web socket server spun up\n";
    }
    //This method is invoked whenever a browser client attempts to connect to the socket server using JS
    public function onOpen(ConnectionInterface $conn)
    {
        //Store new connection
        echo "Incoming connection\n";
        $this->clients->attach($conn);
        echo "\nNew connection: {$conn->resourceId}\n";
        $this->playerIndex = -1;
        //If there are fewer than 2 connections, give this connection an index
        for ($i=0; $i < 2; $i++) { 
            if ($this->players[$i] === null) {
                $this->playerIndex = $i;
                break;
            }
        }
        //Tell the client their player number
        $data->playerIndex = $this->playerIndex;
        //data must be a php object but can be sent as a json encoded string to client
        $conn->send(json_encode($data));
        echo "Player {$this->playerIndex} has connected";
        //Ignore any client if 2 players already connected
        if ($this->playerIndex == -1 ) {return;}
        //Players array - was null, now false to indicate that the connection exists and player is not ready to play
        echo "time to evaluate things";
        $this->players[$this->playerIndex] = false;
        //Broadcast the latest connection to all clients
        $data2->playerConnection = $this->playerIndex;
        foreach ($this->clients as $client)
        {
            $client->send(json_encode($data2));
        }
    }
    //This method is invoked whenever a message is sent to the socket server from a client
    public function onMessage(ConnectionInterface $from, $msg)
    {
        $numRecv = count($this->clients) -1;
        echo sprintf("\nConnection %d sending message %s to %d other connection%s \n", $from->resourceId, $msg, $numRecv, $numRecv == 1 ? '' : 's');
        foreach ($this->clients as $client)
        {
            if ($from != $client)
            {
                $client->send($msg);
            }
        }
        // $data = json_decode($msg);
        // switch ($data->key)
        // {
        //     //case "a": functionA(); break;
        //     default: break;
        // }
    }
    //When page refreshes or browser window closes, socket connection dies
    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        echo "Closing connection: {$conn->resourceId}\n";
        unset($this->players[$conn->resourceId]);
    }
    //If error occurs, log it
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }



    // $host = "127.0.0.1";
    // $port = 8888;
    // // No Timeout 
    // set_time_limit(0);
    // //create socket
    // $socket = socket_create(AF_INET, SOCK_STREAM, 0) or die("Could not create socket\n");
    // //No need to bind() or connnect() since Docker already started the Apache server
    // $message = "message message mgessage";

    // while (true)
    // {
    //     //read server response message
    //     $result = socket_listen($socket, 1024) or die("Could not set up socket listener\n");
    //     echo "reply from server: ".$result . " listening on port " . $port;
    //     //accept incoming connection
    //     $spawn = socket_accept($socket) or die("Could not accept incoming connection\n");
    //     //read message from client socket
    //     $input = socket_read($spawn,1024) or die("Could not read input.\n");
    //     echo $input;
    //     //send message back to client
    //     $output = "output text output text";
    //     socket_write($spawn,$output,strlen($output)) or die("Could not write output.\n");
    // }
    // socket_close($spawn);
    // socket_close($socket);
}
//declare localhost and port

?>