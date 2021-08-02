<?php
namespace WebSocketServer;
class Player
{
    private $index;
    private $resourceId;
    private $ready;
    //Players are created - always created in a "not ready" state
    public function __construct(int $index, int $resourceId)
    {
        $this->index = $index;
        $this->resourceId = $resourceId;
        $this->ready = false;
    }
    //Function to ready up a player
    public function readyUp()
    {
        $this->ready = true;
    }
    //Function to return ready status of a player
    public function getReadyStatus()
    {
       return  $this->ready;
    }
    public function getResourceId()
    {
        return $this->resourceId;
    }
    public function getIndex()
    {
        return $this->index;
    }
}
?>