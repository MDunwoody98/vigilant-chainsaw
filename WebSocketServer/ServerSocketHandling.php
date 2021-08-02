<?php
//Ratchet Websocket library
namespace WebSocketServer;
//Server container process is not by default in html directory
require dirname(__DIR__) . '/server/vendor/autoload.php';
require_once("Player.php");
//Specify Ratchet interfaces
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use WebSocketServer\Player;

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
            if (sizeOf($this->players) === $i) {
                $this->playerIndex = $i;
            }
        }
        //Tell the client their player number
        $data->playerIndex = $this->playerIndex;
        //data must be a php object but can be sent as a json encoded string to client
        $conn->send(json_encode($data));
        echo "Player {$this->playerIndex} has connected with connection id {$conn->resourceId}\n";
        //Ignore any client if 2 players already connected
        if ($this->playerIndex == -1 ) {return;}
        //Players array - was null, now add client and set ready to false to indicate that the connection exists and player is not ready to play
        array_push($this->players, new Player($this->playerIndex, $conn->resourceId));
        echo "Player array size ". sizeof($this->players) . " and value ". $this->players;
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
        //variable to send connections to the other player
        $thisPlayer = $this->players[$this->getKeyForPlayerMatchingConnectionResourceId($from, true)];
        $otherPlayer = $this->players[$this->getKeyForPlayerMatchingConnectionResourceId($from, false)];
        $otherPlayerClient = $otherPlayer != null ? $this->returnClientContainingThisResourceId($otherPlayer->getResourceId()) : null;
        //only process message if json data is received
        $jsonResponse = true;
        $data;
        try {
            $data = json_decode($msg);
            if (is_null($data) || strlen($msg) < 1) {
                throw ('Error');
              }
        } catch (\Throwable $th) {
            $jsonResponse = false;
        }
        //Only process message if it's a json response and there are other clients to receive messages
        switch (true)
        {
            //Switch statement to execute appropriate socket behaviour based on received JSON from client
            case $jsonResponse == false: break;
            //If the player readies up, tell the server they are ready and inform any enemies
            case $data->playerReady == true: $this->enemyReady($from, $otherPlayerClient); break;
            //The client is requesting to know whether there are other connected players already
            case $data->checkPlayers == true: $this->checkPlayers($from, $otherPlayer); break;
            //If the client attacked, tell the enemy which square they targeted
            case $data->shotFired != null: $this->attack($data->shotFired, $otherPlayerClient);
            //If the client was attacked, inform the server and attacking client details of the attack
            case $data->fireReply != null: $this->processAttack($data->fireReply, $otherPlayerClient);
            default: break;
        }
    }
    public function enemyReady($readyPlayer, $playerToInform)
    {
        //Set player object to ready
        $this->players[$this->getKeyForPlayerMatchingConnectionResourceId($readyPlayer, true)]->readyUp();
        //ready up the ready player in the players array, inform the other player that the enemy is ready
        $data->enemyReady = true;
        $data->indexOfReadyPlayer = $this->players[$this->getKeyForPlayerMatchingConnectionResourceId($readyPlayer, true)]->getIndex();
        if ($playerToInform != null) $playerToInform->send(json_encode($data));
        
    }
    public function returnClientContainingThisResourceId($resourceID)
    {
        foreach ($this->clients as $client) {
            if ($client->resourceId == $resourceID) {
                return $client;
            }
        }
    }
    public function checkPlayers($connectedClient, $otherPlayer)
    {
        //function to check for other connections and their ready statuses
        //If other client is null, return false/nothing. There's no other connection
        //If other player->ready status is false, return that the player exists and is not ready
        //Otherwise, return that player is connected and is ready
        $data->otherPlayerExists = ($otherPlayer != null);
        $data->otherPlayerReady = $data->otherPlayerExists ? $otherPlayer->getReadyStatus() : false;
        $data->otherPlayerIndex = $data->otherPlayerExists ? $otherPlayer->getIndex() : -1;
        //Tell the connectedclient this data
        $connectedClient->send(json_encode($data));
    }
    //Attack function - client has targeted a tile of another player
    public function attack($idOfTargetedTile, $clientConnectionOfTargetedPlayer)
    {
        $data->attack = $idOfTargetedTile;
        $clientConnectionOfTargetedPlayer->send(json_encode($data));
    }
    //Process attack - the attacked client has told server of the shot details, fwd this data to the attacking client
    public function processAttack($classListOfTargetedSquare, $opponentClient)
    {
        //forward reply to the other player's client
        echo "Classes are " . var_dump($classListOfTargetedSquare);
        $data->shotReport = $classListOfTargetedSquare;
        $opponentClient->send(json_encode($data));
    }

    //When page refreshes or browser window closes, socket connection dies
    public function onClose(ConnectionInterface $conn)
    {
        $this->clients->detach($conn);
        echo "Closing connection: {$conn->resourceId}\n";
        unset($this->players[$this->getKeyForPlayerMatchingConnectionResourceId($conn, true)]);
        echo "After closing {$conn->resourceId}, the connected players array size is ". sizeof($this->players);
        //inform all clients that a connection has died
        $data->playerConnection = $this->playerIndex;
        foreach ($this->clients as $client)
        {
            $client->send(json_encode($data));
        }
    }
    public function getKeyForPlayerMatchingConnectionResourceId(ConnectionInterface $conn, bool $returnThisPlayerAndDontReturnEnemy)
    {
        //Get key for players array that corresponds to the resource ID of the object implementing ConnectionInterface
        foreach ($this->players as $connectedPlayer) {
            if (($connectedPlayer->getResourceId() == $conn->resourceId) == $returnThisPlayerAndDontReturnEnemy) {
                //Have to get key when we have value.
                if (($key = array_search($connectedPlayer, $this->players)) !== false) {
                    return $key;
                }
            }
        }
        return null;
    }
    //If error occurs, log it
    public function onError(ConnectionInterface $conn, \Exception $e)
    {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
        try {
            $this->clients->detach($conn);
            unset($this->players[$this->getKeyForPlayerMatchingConnectionResourceId($conn, true)]);
        } catch (\Throwable $th) {}
    }
}
?>