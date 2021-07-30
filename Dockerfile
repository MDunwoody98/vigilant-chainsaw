#Apache container
FROM php:apache
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