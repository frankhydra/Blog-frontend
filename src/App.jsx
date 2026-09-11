import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// Every page is loaded lazily, split into its own chunk that Vite only
// fetches when that route is actually visited - previously everything
// (including the Quill rich text editor, pulled in by PostForm/NewPost/
// EditPost/NewLetter/EditLetter) shipped in one 620KB+ bundle on every
// single page load, admin pages and Settings included, regardless of
// whether the visitor ever touched them. Layout and Loading stay as
// regular imports since they're needed immediately on every route.
const Home = lazy(() => import('./pages/Home'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminComments = lazy(() => import('./pages/AdminComments'));
const CommunityBlogs = lazy(() => import('./pages/CommunityBlogs'));
const AllTags = lazy(() => import('./pages/AllTags'));
const TagPosts = lazy(() => import('./pages/TagPosts'));
const AuthorProfile = lazy(() => import('./pages/AuthorProfile'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const MyContactMessages = lazy(() => import('./pages/MyContactMessages'));
const NewPost = lazy(() => import('./pages/NewPost'));
const EditPost = lazy(() => import('./pages/EditPost'));
const MyPosts = lazy(() => import('./pages/MyPosts'));
const Letters = lazy(() => import('./pages/Letters'));
const LetterDetail = lazy(() => import('./pages/LetterDetail'));
const NewLetter = lazy(() => import('./pages/NewLetter'));
const EditLetter = lazy(() => import('./pages/EditLetter'));
const Write = lazy(() => import('./pages/Write'));
const Books = lazy(() => import('./pages/Books'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const NewBook = lazy(() => import('./pages/NewBook'));
const EditBook = lazy(() => import('./pages/EditBook'));
const About = lazy(() => import('./pages/About'));
const Portfolios = lazy(() => import('./pages/Portfolios'));
const Settings = lazy(() => import('./pages/Settings'));
const RequestCampaign = lazy(() => import('./pages/RequestCampaign'));
const AdminCampaigns = lazy(() => import('./pages/AdminCampaigns'));
const AdminPosts = lazy(() => import('./pages/AdminPosts'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const CampaignDetail = lazy(() => import('./pages/CampaignDetail'));

export default function App() {
  return (
    <Routes>
      {/* Layout wraps every page below with the shared header/footer.
          Suspense lives INSIDE Layout (around its <Outlet/>), not here -
          so the header/footer chrome stays mounted across navigations
          instead of the whole page flashing to a blank loading state
          every time a lazy route's chunk is still being fetched. */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
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
        <Route path="settings" element={<Settings />} />
        <Route path="edit-profile" element={<Navigate to="/settings?tab=profile" replace />} />
        <Route path="my-portfolio" element={<Navigate to="/settings?tab=portfolio" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="admin/comments" element={<AdminComments />} />
        <Route path="community" element={<CommunityBlogs />} />
        <Route path="tags" element={<AllTags />} />
        <Route path="tags/:slug" element={<TagPosts />} />
        <Route path="authors/:id" element={<AuthorProfile />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/categories" element={<AdminCategories />} />
        <Route path="my/contact-messages" element={<MyContactMessages />} />
        <Route path="request-campaign" element={<RequestCampaign />} />
        <Route path="admin/campaigns" element={<AdminCampaigns />} />
        <Route path="admin/posts" element={<AdminPosts />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
      </Route>
    </Routes>
  );
}
