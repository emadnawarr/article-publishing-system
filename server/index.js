import express from "express";
import mysql from "mysql2/promise";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'null',
    database: 'bloggingsystem',
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required' });
    }
    const loginQuery = "SELECT * FROM users WHERE email = ? AND password = ?";
    try {
        const [result] = await db.query(loginQuery, [email, password]);

        if (result.length > 0) {
            res.send({ result, success: true, message: "You have successfully signed in" });
        } else {
            res.status(401).send({ message: "Wrong username/password combination" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});


app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    try {
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).send({ message: 'All fields are required' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send({ message: 'Invalid email format' });
        }

        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).send({ message: 'Email is already registered' });
        }

        // Validate password complexity
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send({
                message: 'Password must be at least 8 characters long and include a number and a special character',
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).send({ message: 'Password and Confirm Password must match' });
        }
        //TODO: hash pass

        const insertUserQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        await db.execute(insertUserQuery, [name, email, password]);

        // Respond with success message
        res.send({ success: true, message: 'User successfully registered' });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

function getCurrentDate() {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    return today;
}

app.post('/publish', async (req, res) => {
    const { title, summary, body, published_by } = req.body;
    if (!title || !summary || !body || !published_by) {
        return res.status(400).send({ message: 'All fields are required' });
    }
    const published_on = getCurrentDate();
    const publishArticleQuery = 'INSERT INTO articles (title, summary, body, published_by, published_on) VALUES (?, ?, ?, ?, ?)';
    const incrementNumOfArticlesQuery = 'UPDATE users SET numOfArticles = numOfArticles + 1 WHERE id = ?';

    try {
        await db.query(publishArticleQuery, [title, summary, body, published_by, published_on]);
        await db.query(incrementNumOfArticlesQuery, [published_by]);
        res.send({ success: true, message: 'Article Published!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/addTag', async (req, res) => {
    const { tag, article_id } = req.body;
    if (!tag || !article_id) {
        return res.status(400).send({ message: 'All fields are required' });
    }
    //either anyone an add a tag or only the publisher
    const insertTag = 'INSERT IGNORE INTO tags (name) VALUES (?)';
    const insertArticleTag = 'INSERT IGNORE INTO article_tags(article_id, tag_name) VALUES (?, ?)';
    //if duplicate we can send sqlmessage
    try {
        await db.query(insertTag, [tag]);
        await db.query(insertArticleTag, [article_id, tag]);
        res.send({ success: true, message: 'Tag Added!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

//title and summary shown in feed but when we click on the title we get the whole article
app.get('/viewFullArticle', async (req, res) => {
    const { article_id } = req.query;
    if (!article_id) {
        return res.status(400).send({ message: 'Article ID is required' });
    }

    const incrementViewersQuery = 'UPDATE articles SET viewers = viewers + 1 WHERE id = ?';
    const getArticleQuery = 'SELECT * FROM articles WHERE id = ?';
    const incrementTagsVisitedQuery = 'UPDATE tags SET visited = visited + 1 WHERE name IN (SELECT tag_name FROM article_tags WHERE article_id = ?)';

    try {
        await db.query(incrementViewersQuery, [article_id]);
        const [article] = await db.query(getArticleQuery, [article_id]);
        await db.query(incrementTagsVisitedQuery, [article_id]);
        res.send({ success: true, article: article[0], message: 'Article sent and number of viewers incremented for article and tags' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});


app.put('/likeArticle', async (req, res) => {
    const { article_id } = req.body;
    if (!article_id) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    const incrementLikesQuery = 'UPDATE articles SET likes = likes + 1 WHERE id = ?'

    try {
        await db.query(incrementLikesQuery, [article_id]);
        //if no article beyragga3 success which is wrong bas how haydoos 3aleeha kda kda
        res.send({ success: true, message: 'Number of likes incremented' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.post('/followTag', async (req, res) => {
    const { user, tag } = req.body;
    if (!user || !tag) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    const followTagQuery = 'INSERT INTO tag_followers(user_id, tag_name) VALUES(?,?)';
    try {
        await db.query(followTagQuery, [user, tag]);
        res.send({ success: true, message: 'User followed this tag successfully!' })
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
    //TODO: handle duplicate entries
})


app.post('/followPublisher', async (req, res) => {
    const { mainUser, publisher } = req.body;
    if (!publisher || !mainUser) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    try {
        // Check if the publisher has at least one article published
        const checkPublisherQuery = 'SELECT id FROM users WHERE id = ? AND numOfArticles > 0';
        const [publisherExists] = await db.query(checkPublisherQuery, [publisher]);

        if (publisherExists.length === 0) {
            return res.status(400).send({ message: 'Publisher does not have any published articles' });
        }

        const followPublisherQuery = 'INSERT INTO followers (follower_id, followed_id) VALUES (?, ?)';
        await db.query(followPublisherQuery, [mainUser, publisher]);

        res.send({ success: true, message: 'User followed this publisher successfully!' });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
});

app.get('/displayFeed', async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) {
        return res.status(400).send({ message: 'User ID is required' });
    }
    //TODO: also send followed publisher articles
    try {
        const articlesWithRelevantTagsQuery = `
            SELECT a.id, a.title, a.summary, a.body, a.viewers, a.likes, a.published_by, a.published_on
            FROM articles a
            JOIN article_tags atg ON a.id = atg.article_id
            JOIN tags t ON atg.tag_name = t.name
            JOIN tag_followers tf ON t.name = tf.tag_name
            WHERE tf.user_id = ?
            ORDER BY a.published_on DESC
        `;

        const articlesWithMostPopularTagsQuery = `
        SELECT a.id, a.title, a.summary, a.body, a.viewers, a.likes, a.published_by, a.published_on
        FROM articles a
        JOIN article_tags atg ON a.id = atg.article_id
        JOIN tags t ON atg.tag_name = t.name
        ORDER BY t.visited DESC, a.published_on DESC;
        `
        const [articlesWithRelevantTags] = await db.query(articlesWithRelevantTagsQuery, [user_id]);
        const [articlesWithMostPopularTags] = await db.query(articlesWithMostPopularTagsQuery);
        res.send({ success: true, articlesWithRelevantTags, articlesWithMostPopularTags });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
})

app.get('/getNamesOfHighestVisitedTags', async (req, res) => {

    try {
        const [tagNames] = await db.query("SELECT * FROM tags ORDER BY visited DESC;");
        res.send({ success: true, tagNames });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ error: 'Internal Server Error' });
    }
})


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
