CREATE TABLE Customers (
  cid SERIAL PRIMARY KEY,  -- Auto-incrementing integer for customer ID
  email VARCHAR(255) NOT NULL UNIQUE,  -- Customer's email address (unique)
  password VARCHAR(255) NOT NULL  -- Hashed password
  -- Add other relevant customer information here (e.g., name, phone)
)


CREATE TABLE Sellers (
  sid SERIAL PRIMARY KEY,  -- Auto-incrementing integer for seller ID
  email VARCHAR(255) NOT NULL UNIQUE,  -- Seller's email address (unique)
  password VARCHAR(255) NOT NULL  -- Hashed password
  -- Add other relevant seller information here (e.g., company name, address)
)


CREATE TABLE Products (
  pid SERIAL PRIMARY KEY,  -- Auto-incrementing integer for product ID
  ProdName VARCHAR(255) NOT NULL,  -- Product name
  description TEXT,  -- Product description (allows longer text)
  price DECIMAL(10,2) NOT NULL,  -- Product price with two decimal places
  category VARCHAR(255),  -- Product category
  imagename VARCHAR(255),  -- Image name for the product
  sid INTEGER NOT NULL,  -- Foreign key referencing seller ID
  FOREIGN KEY (sid) REFERENCES Sellers(sid)  -- Enforces relationship
)


