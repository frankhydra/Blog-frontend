import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import OwnerBlog from './pages/OwnerBlog';
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
import Write from './pages/Write';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import NewBook from './pages/NewBook';
import EditBook from './pages/EditBook';
import About from './pages/About';
import Portfolios from './pages/Portfolios';
import EditProfile from './pages/EditProfile';
import MyPortfolio from './pages/MyPortfolio';
import RequestCampaign from './pages/RequestCampaign';
import AdminCampaigns from './pages/AdminCampaigns';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';

export default function App() {
  return (
    <Routes>
      {/* Layout wraps every page below with the shared header/footer */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<OwnerBlog />} />
        <Route path="posts/:slug" element={<PostDetail />} />
        <Route path="posts/:slug/edit" element={<EditPost />} />
        <Route path="write" element={<Write />} />
        <Route path="write/post" element={<NewPost />} />
        <Route path="my-posts" element={<MyPosts />} />
        <Route path="letters" element={<Letters />} />
        <Route path="letters/:slug" element={<LetterDetail />} />
        <Route path="letters/:slug/edit" element={<EditLetter />} />
        <Route path="write/letter" element={<NewLetter />} />
        <Route path="write-letter" element={<NewLetter />} />
        <Route path="books" element={<Books />} />
        <Route path="books/:slug" element={<BookDetail />} />
        <Route path="books/:slug/edit" element={<EditBook />} />
        <Route path="add-book" element={<NewBook />} />
        <Route path="about" element={<About />} />
        <Route path="portfolio" element={<Portfolios />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="my-portfolio" element={<MyPortfolio />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="admin/comments" element={<AdminComments />} />
        <Route path="community" element={<CommunityBlogs />} />
        <Route path="authors/:id" element={<AuthorProfile />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="request-campaign" element={<RequestCampaign />} />
        <Route path="admin/campaigns" element={<AdminCampaigns />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
      </Route>
    </Routes>
  );
}
