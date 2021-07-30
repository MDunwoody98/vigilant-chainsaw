#PHP CLI
FROM php:7.2-cli
#Websockers
RUN docker-php-ext-install sockets
# Install git
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y git
# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer
#Ratchet module
RUN composer require cboden/ratchet
#Run Socket Web Server on port 8080 alongside the Apache server
CMD ["php", "SocketServer.php"]