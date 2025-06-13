import Express from 'express'
import Cors from 'cors'
import Pg from 'pg'
import Dotenv from 'dotenv'
import Bcrypt from 'bcrypt'
import Crypto from 'crypto'
import readline from 'readline'


Dotenv.config()

const { Pool } = Pg
const App = Express()
const Port = process.env.PORT || 8080

const DatabasePool = new Pool({
    connectionString: process.env.DATABASE_URL,
})

App.use(Cors({ origin: true, credentials: true }))
App.use(Express.json())

const EmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const IsStrongPassword = (Password) => {
    const PasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    return PasswordRegex.test(Password)
}

const GenerateToken = (Email, Password) =>
    Crypto.createHash('sha256').update(Email + Password).digest('hex')

const AuthenticateToken = async (Request, Response, Next) => {
    const Token = Request.headers['authorization']?.split(' ')[1]

    if (!Token) {
        return Response.status(401).json({ Error: 'Token required' })
    }

    try {
        const Result = await DatabasePool.query(
            'SELECT id, email, username, token, role FROM users WHERE token = $1',
            [Token]
        )

        if (Result.rowCount === 0) {
            return Response.status(401).json({ Error: 'Invalid token' })
        }

        Request.User = Result.rows[0]
        Next()
    } catch (Error) {
        console.error(Error)
        Response.status(500).json({ Error: 'Authentication failed' })
    }
}

// GET /posts — fetch all posts with username and owner token, allow searching by content or username
App.get('/posts', AuthenticateToken, async (Request, Response) => {
    const SearchQuery = Request.query.search || ''

    try {
        let QueryText = `
      SELECT posts.id, posts.content, posts.createdat, users.username, users.token
      FROM posts
      JOIN users ON posts.userid = users.id
    `
        let QueryParams = []

        if (SearchQuery.trim() !== '') {
            QueryText += ` WHERE posts.content ILIKE $1 OR users.username ILIKE $1 `
            QueryParams.push(`%${SearchQuery.trim()}%`)
        }

        QueryText += ` ORDER BY posts.createdat DESC LIMIT 500`

        const Result = await DatabasePool.query(QueryText, QueryParams)

        Response.json({
            Message: 'Posts fetched successfully',
            Posts: Result.rows,
        })
    } catch (Error) {
        console.error(Error)
        Response.status(500).json({ Error: 'Failed to fetch posts' })
    }
})

// POST /post — add new post, return post with owner info
App.post('/post', AuthenticateToken, async (Request, Response) => {
    const { Content } = Request.body

    if (!Content || Content.trim() === '') {
        return Response.status(400).json({ Error: 'Post content cannot be empty' })
    }

    try {
        const Result = await DatabasePool.query(
            `INSERT INTO posts (userid, content, createdat)
       SELECT id, $1, now() FROM users WHERE token = $2
       RETURNING id, content, createdat`,
            [Content.trim(), Request.User.token]
        )

        if (Result.rowCount === 0) {
            return Response.status(400).json({ Error: 'User not found' })
        }

        Response.status(201).json({
            Message: 'Post created',
            Post: {
                Id: Result.rows[0].id,
                Content: Result.rows[0].content,
                CreatedAt: Result.rows[0].createdat,
                Username: Request.User.username || 'You',
                OwnerToken: Request.User.token,
            },
        })
    } catch (Error) {
        console.error(Error)
        Response.status(500).json({ Error: 'Failed to create post' })
    }
})


App.delete('/post/:postId', AuthenticateToken, async (Request, Response) => {
    const PostId = Request.params.postId

    try {
        if (Request.User.role === 'Admin') {
            const DeleteResult = await DatabasePool.query(
                'DELETE FROM posts WHERE id = $1 RETURNING id',
                [PostId]
            )

            if (DeleteResult.rowCount === 0) {
                return Response.status(404).json({ Error: 'Post not found' })
            }

            return Response.json({ Message: 'Post deleted successfully by admin' })
        } else {
            // Regular user can only delete their own post
            const Result = await DatabasePool.query(
                `SELECT posts.id FROM posts
                 JOIN users ON posts.userid = users.id
                 WHERE posts.id = $1 AND users.token = $2`,
                [PostId, Request.User.token]
            )

            if (Result.rowCount === 0) {
                return Response.status(404).json({ Error: 'Post not found or unauthorized' })
            }

            await DatabasePool.query('DELETE FROM posts WHERE id = $1', [PostId])

            Response.json({ Message: 'Post deleted successfully' })
        }
    } catch (Error) {
        console.error(Error)
        Response.status(500).json({ Error: 'Failed to delete post' })
    }
})


// DELETE /delete-account — deletes user and their posts
App.delete('/delete-account', AuthenticateToken, async (Request, Response) => {
    try {
        await DatabasePool.query('BEGIN')

        await DatabasePool.query('DELETE FROM posts WHERE userid = $1', [Request.User.id])

        const Result = await DatabasePool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [Request.User.id]
        )

        if (Result.rowCount === 0) {
            await DatabasePool.query('ROLLBACK')
            return Response.status(404).json({ Error: 'User not found' })
        }

        await DatabasePool.query('COMMIT')

        Response.json({ Message: 'Account deleted successfully' })
    } catch (Error) {
        await DatabasePool.query('ROLLBACK')
        console.error(Error)
        Response.status(500).json({ Error: 'Failed to delete account' })
    }
})

App.get('/', (Request, Response) => {
    Response.json({ Message: 'Success' })
})

App.post('/signup', async (Request, Response) => {
    let { Email, Password, Username, Role } = Request.body

    if (!Email || !Password) {
        return Response.status(400).json({ Error: 'Email and Password required' })
    }

    Email = Email.trim().toLowerCase()
    Role = Role?.trim().toLowerCase() || 'User'

    if (!EmailRegex.test(Email)) {
        return Response.status(400).json({ Error: 'Invalid email format' })
    }

    if (!IsStrongPassword(Password)) {
        return Response.status(400).json({
            Error:
                'Password must be at least 8 characters long and include uppercase, lowercase letters and numbers.',
        })
    }

    try {
        const Existing = await DatabasePool.query('SELECT * FROM users WHERE email = $1', [Email])

        if (Existing.rowCount > 0) {
            return Response.status(409).json({ Error: 'Email already registered' })
        }

        const SaltRounds = 10
        const HashedPassword = await Bcrypt.hash(Password, SaltRounds)
        const Token = GenerateToken(Email, Password)

        const Result = await DatabasePool.query(
            'INSERT INTO users (email, password, username, token, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, username, token, role',
            [Email, HashedPassword, Username || null, Token, Role]
        )

        Response.status(201).json({
            Message: 'User created',
            Token: Result.rows[0].token,
            Role: Result.rows[0].role,
        })
    } catch (Error) {
        console.error(Error)
        Response.status(500).json({ Error: 'Signup failed' })
    }
})

// POST /login — authenticate user and return token
App.post('/login', async (Request, Response) => {
    let { Email, Password } = Request.body

    if (!Email || !Password) {
        return Response.status(400).json({ Error: 'Email and Password required' })
    }

    Email = Email.trim().toLowerCase()

    try {
        const Result = await DatabasePool.query('SELECT * FROM users WHERE email = $1', [Email])

        if (Result.rowCount === 0) {
            return Response.status(401).json({ Error: 'Invalid credentials' })
        }

        const User = Result.rows[0]
        const PasswordMatch = await Bcrypt.compare(Password, User.password)
        if (!PasswordMatch) {
            return Response.status(401).json({ Error: 'Invalid credentials' })
        }

        Response.json({
            Message: 'Login successful',
            Token: User.token,
            Role: User.role,
        })
    } catch (Error) {
        console.error(Error)
        Response.status(500).json({ Error: 'Login failed' })
    }
})

const ChangeUserRole = async (Email, NewRole) => {
    if (!Email || !NewRole) throw new Error('Email and NewRole are required')

    const Role = NewRole.trim();
    const ValidRoles = ['User', 'Admin']
    if (!ValidRoles.includes(Role)) {
        throw new Error(`Invalid role. Valid roles are: ${ValidRoles.join(', ')}`)
    }

    const Result = await DatabasePool.query(
        'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, username, role',
        [Role, Email.trim().toLowerCase()]
    )

    if (Result.rowCount === 0) throw new Error('User not found')

    return Result.rows[0]
}

// Set up readline for command input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
})

rl.prompt()

rl.on('line', async (line) => {
    const input = line.trim()

    if (input.startsWith('/role ')) {
        const parts = input.split(' ')
        if (parts.length !== 3) {
            console.log('Usage: /role email role')
        } else {
            const [, email, role] = parts
            try {
                const updatedUser = await ChangeUserRole(email, role)
                console.log(`Role updated: ${updatedUser.email} is now a ${updatedUser.role}`)
            } catch (error) {
                console.error('Error:', error.message)
            }
        }
    } else if (input === '/exit') {
        console.log('Exiting command prompt...')
        rl.close()
        process.exit(0)
    } else {
        console.log('Unknown command. Use /role email role or /exit')
    }

    rl.prompt()
})


App.listen(Port, () => {
    console.log(`Server running on http://localhost:${Port}`)
    console.log('Type /exit to quit')

})
