CREATE TABLE t_p43401283_flower_shop_delivery.customers (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100),
    phone           VARCHAR(20) UNIQUE NOT NULL,
    email           VARCHAR(150) UNIQUE,
    password_hash   VARCHAR(255),
    birth_date      DATE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p43401283_flower_shop_delivery.customer_addresses (
    id           SERIAL PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES t_p43401283_flower_shop_delivery.customers(id),
    label        VARCHAR(50),
    address      TEXT NOT NULL,
    is_default   BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p43401283_flower_shop_delivery.categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    sort_order  INTEGER DEFAULT 0
);

CREATE TABLE t_p43401283_flower_shop_delivery.products (
    id           SERIAL PRIMARY KEY,
    category_id  INTEGER REFERENCES t_p43401283_flower_shop_delivery.categories(id),
    name         VARCHAR(150) NOT NULL,
    slug         VARCHAR(150) UNIQUE NOT NULL,
    description  TEXT,
    composition  TEXT,
    price        NUMERIC(10,2) NOT NULL,
    old_price    NUMERIC(10,2),
    image_url    TEXT,
    tag          VARCHAR(50),
    in_stock     BOOLEAN DEFAULT TRUE,
    sort_order   INTEGER DEFAULT 0,
    created_at   TIMESTAMP DEFAULT NOW(),
    updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p43401283_flower_shop_delivery.orders (
    id               SERIAL PRIMARY KEY,
    customer_id      INTEGER REFERENCES t_p43401283_flower_shop_delivery.customers(id),
    status           VARCHAR(30) DEFAULT 'new',
    total_price      NUMERIC(10,2) NOT NULL,
    delivery_address TEXT,
    delivery_date    DATE,
    delivery_time    VARCHAR(50),
    recipient_name   VARCHAR(100),
    recipient_phone  VARCHAR(20),
    note             TEXT,
    is_anonymous     BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p43401283_flower_shop_delivery.order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL REFERENCES t_p43401283_flower_shop_delivery.orders(id),
    product_id  INTEGER REFERENCES t_p43401283_flower_shop_delivery.products(id),
    name        VARCHAR(150) NOT NULL,
    price       NUMERIC(10,2) NOT NULL,
    quantity    INTEGER NOT NULL DEFAULT 1
);
