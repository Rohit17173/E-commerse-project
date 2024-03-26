import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import multer from "multer";
import path from "path";



const app = express();
const port = 3000;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "SECREAT",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 100 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "management",
  password: "password",
  port: 5432,
});
db.connect();

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("customerLogin.ejs");
});

app.get("/register", (req, res) => {
  res.render("customerRegister.ejs");
});

app.get("/loginSel", (req, res) => {
  res.render("selleLogin.ejs");
});

app.get("/registerSel", (req, res) => {
  res.render("sellerRegister.ejs");
});

app.get("/home", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("customerHome.ejs", { Customers: req.user });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});



app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  try {
    const checkResult = await db.query("SELECT * FROM Customers WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      //hashing the password and saving it in the database
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          console.log("Hashed Password:", hash);
          const result = await db.query(
            "INSERT INTO Customers (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          req.logIn(user, (err) => {
            console.log(err);
            res.redirect("/home");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/login",
  passport.authenticate("customer", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

passport.use(
  "customer",
  new Strategy(async function verify(username, password, cb) {
    console.log(username);

    try {
      const result = await db.query("SELECT * FROM Customers WHERE email = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("Customer not found");
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});


async function getProduct() {
  const result = await db.query("SELECT * FROM products");
  const products = result.rows;
  return products;
}

app.get("/home/product", async(req, res) => {

  try {
    const products = await getProduct();
    res.render("products.ejs", { Customers: req.user , products : products});
    console.log(products);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});



// this END of customer login route

app.get("/selhome", (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    res.render("sellerDashboard.ejs", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

app.post("/Selregister", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query(
      "SELECT * FROM Sellers WHERE email = $1",
      [email]
    );

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      //hashing the password and saving it in the database
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          console.log("Hashed Password:", hash);
          const result = await db.query(
            "INSERT INTO Sellers (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const Sellers = result.rows[0];
          req.logIn(Sellers, (err) => {
            console.log(err);
            res.redirect("/selhome");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/Selogin",
  passport.authenticate("seller", {
    successRedirect: "/selhome",
    failureRedirect: "/loginSel",
  })
);

passport.use(
  "seller",
  new Strategy(async function verify(username, password, cb) {
    console.log(username);

    try {
      const result = await db.query("SELECT * FROM Sellers WHERE email = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      return cb(err);
    }
  })
);


app.get("/selhome/addproduct", (req, res) => {
  res.render("addProduct.ejs", { user: req.user});
});

// code for adding product



const storage = multer.diskStorage({
  destination: "public/images/", // Folder to store uploaded images
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}


app.post(
  "/selhome/addProduct",
  isLoggedIn,
  upload.single("productImage"),
  async (req, res) => {
    // ... extract details from request (userId, product data)

    if (!req.file) {
      return res.send("Please select an image to upload.");
    }

    // ... add imagePath to productData and proceed with database interaction

    try {
      const productName = req.body.productName;
      const productDescription = req.body.productDescription;
      const productPrice = req.body.productPrice;
      const productCategory = req.body.productCategory;
      const imageName = req.file.filename;
      const sellerid = req.body.sellerId;
      const imagePath = "/images/" + imageName;

      await db.query("INSERT INTO products (prodname, description, price, category, imagename, sid) VALUES ($1, $2, $3, $4, $5, $6)", [productName, productDescription, productPrice, productCategory, imageName, sellerid]);
      res.redirect("/selhome");
    } catch (err) {
      console.log(err);
    }
  }
);


async function getMyProduct(sid) {
  const result = await db.query("SELECT * FROM products WHERE sid = $1",[sid]);
  const products = result.rows;
  return products;
}

app.get("/home/myproduct", async(req, res) => {

  try {
    const sid = req.user.sid;
    console.log(sid);
    const products = await getMyProduct(sid);
    res.render("myProducts.ejs", { user: req.user , products : products});
    // console.log(products);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
