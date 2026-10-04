const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Helper Promise wrappers demonstrating asynchronous execution
const getAllBooksPromise = () => {
  return new Promise((resolve, reject) => {
    try {
      resolve(books);
    } catch (err) {
      reject(err);
    }
  });
};

const getBookByISBNPromise = (isbn) => {
  return new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error(`Book with ISBN ${isbn} not found`));
    }
  });
};

const getBooksByAuthorPromise = (author) => {
  return new Promise((resolve) => {
    const authorQuery = author.toLowerCase().trim();
    const matching = {};
    for (const [isbn, book] of Object.entries(books)) {
      if (book.author.toLowerCase().includes(authorQuery)) {
        matching[isbn] = book;
      }
    }
    resolve(matching);
  });
};

const getBooksByTitlePromise = (title) => {
  return new Promise((resolve) => {
    const titleQuery = title.toLowerCase().trim();
    const matching = {};
    for (const [isbn, book] of Object.entries(books)) {
      if (book.title.toLowerCase().includes(titleQuery)) {
        matching[isbn] = book;
      }
    }
    resolve(matching);
  });
};

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop using async/await
public_users.get('/', async function (req, res) {
  try {
    const bookList = await Promise.resolve(books);
    return res.status(200).json(bookList);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving book list", error: error.message });
  }
});

// Get book details based on ISBN using Promises
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  getBookByISBNPromise(isbn)
    .then((book) => {
      return res.status(200).json(book);
    })
    .catch((error) => {
      return res.status(404).json({ message: error.message });
    });
});

// Get book details based on author using Promises
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  getBooksByAuthorPromise(author)
    .then((matchingBooks) => {
      if (Object.keys(matchingBooks).length > 0) {
        return res.status(200).json(matchingBooks);
      } else {
        return res.status(404).json({ message: `No books found for author: ${author}` });
      }
    })
    .catch((error) => {
      return res.status(500).json({ message: "Error searching by author", error: error.message });
    });
});

// Get all books based on title using Promises
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  getBooksByTitlePromise(title)
    .then((matchingBooks) => {
      if (Object.keys(matchingBooks).length > 0) {
        return res.status(200).json(matchingBooks);
      } else {
        return res.status(404).json({ message: `No books found for title: ${title}` });
      }
    })
    .catch((error) => {
      return res.status(500).json({ message: "Error searching by title", error: error.message });
    });
});

// Get book review based on ISBN
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  } else {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
});

module.exports.general = public_users;
module.exports.getAllBooksPromise = getAllBooksPromise;
module.exports.getBookByISBNPromise = getBookByISBNPromise;
module.exports.getBooksByAuthorPromise = getBooksByAuthorPromise;
module.exports.getBooksByTitlePromise = getBooksByTitlePromise;
