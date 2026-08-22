import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminComments from './pages/AdminComments';
import CommunityBlogs from './pages/CommunityBlogs';
import AuthorProfile from './pages/AuthorProfile';
import AdminUsers from './pages/AdminUsers';
import NewPost from './pages/NewPost';
import EditPost from './pages/EditPost';
import MyPosts from './pages/MyPosts';
import Letters from './pages/Letters';
import LetterDetail from './pages/LetterDetail';
import NewLetter from './pages/NewLetter';
import EditLetter from './pages/EditLetter';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import NewBook from './pages/NewBook';
import EditBook from './pages/EditBook';
import About from './pages/About';
import EditProfile from './pages/EditProfile';
import AdminPortfolio from './pages/AdminPortfolio';

export default function App() {
  return (
    <Routes>
      {/* Layout wraps every page below with the shared header/footer */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="posts/:slug" element={<PostDetail />} />
        <Route path="posts/:slug/edit" element={<EditPost />} />
        <Route path="write" element={<NewPost />} />
        <Route path="my-posts" element={<MyPosts />} />
        <Route path="letters" element={<Letters />} />
        <Route path="letters/:slug" element={<LetterDetail />} />
        <Route path="letters/:slug/edit" element={<EditLetter />} />
        <Route path="write-letter" element={<NewLetter />} />
        <Route path="books" element={<Books />} />
        <Route path="books/:slug" element={<BookDetail />} />
        <Route path="books/:slug/edit" element={<EditBook />} />
        <Route path="add-book" element={<NewBook />} />
        <Route path="about" element={<About />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="admin/portfolio" element={<AdminPortfolio />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="admin/comments" element={<AdminComments />} />
        <Route path="community" element={<CommunityBlogs />} />
        <Route path="authors/:id" element={<AuthorProfile />} />
        <Route path="admin/users" element={<AdminUsers />} />
      </Route>
    </Routes>
  );
}
