import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";

// Las páginas secundarias se cargan bajo demanda para que la portada abra más rápido.
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Compare = lazy(() => import("./pages/Compare"));

const page = el => <Suspense fallback={<div style={{ minHeight: "70vh" }} />}>{el}</Suspense>;

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "catalog", element: page(<Catalog />) },
            { path: "product/:id/:slug?", element: page(<ProductDetail />) },
            { path: "cart", element: page(<Cart />) },
            { path: "checkout", element: page(<Checkout />) },
            { path: "order-confirmation/:id", element: page(<OrderConfirmation />) },
            { path: "login", element: page(<Login />) },
            { path: "register", element: page(<Register />) },
            { path: "account", element: page(<Account />) },
            { path: "admin", element: page(<Admin />) },
            { path: "compare", element: page(<Compare />) },
            { path: "*", element: page(<NotFound />) },
        ],
    },
]);
