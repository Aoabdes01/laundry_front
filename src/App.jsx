
import { Provider } from 'react-redux'
import { store } from './store/store'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './Auth/Login'
import Layout from './components/layout/layout'
import RequireAuth from './routes/RequireAuth'
import UserManagement from './pages/admin/UserManagement'
import AllCommandes from './pages/admin/AllCommandes'
import AdminCommandeDetail from './pages/admin/AdminCommandeDetail'
import AllClients from './pages/admin/AllClients'
import ClientCommandes from './pages/admin/ClientCommandes'
import AdminDashboard from './pages/admin/AdminDashboard'
import CarpetTypes from './pages/admin/CarpetTypes'
import PersistLogin from './routes/PersistLogin'
import RegisterClient from './pages/livreur/RegisterClient'
import Dashboard from './pages/livreur/LivreurDashboard'
import CreateOrder from './pages/livreur/CreateOrder'

import ReadyForDelivery from './pages/livreur/ReadyForDelivery'
import CanceledDeliveries from './pages/livreur/CanceledDeliveries'
import DeliveryDetails from './pages/livreur/DeliveryDetails'
import EmployeDashboard from './pages/employe/EmployeDashboard'
import CommandeDetail from './pages/employe/CommandeDetail'
import ReturnedOrders from './pages/employe/ReturnedOrders'
import NotificationsPage from './pages/admin/NotificationsPage'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import SuspendedAccount from './pages/errors/SuspendedAccount'
import Forbidden from './pages/errors/Forbidden'
import NotFound from './pages/errors/NotFound'


function App() {


  return (
    <>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/compte-suspendu" element={<SuspendedAccount />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="/interdit" element={<Forbidden />} />
            <Route element={<PersistLogin />}>

              <Route element={<Layout />}>
                <Route path="/" element={<Login />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                <Route element={<RequireAuth allowedRoles={["admin"]} />}>
                  <Route path='/admin/dashboard' element={<AdminDashboard />} />
                  <Route path='/admin/users-management' element={<UserManagement />} />
                  <Route path='/admin/commandes' element={<AllCommandes />} />
                  <Route path='/admin/commandes/:id' element={<AdminCommandeDetail />} />
                  <Route path='/admin/clients' element={<AllClients />} />
                  <Route path='/admin/clients/:clientId' element={<ClientCommandes />} />
                  <Route path='/admin/carpet-types' element={<CarpetTypes />} />
                </Route>

                <Route element={<RequireAuth allowedRoles={["livreur"]} />}>
                  <Route path='/livreur' element={<Dashboard />} />
                  <Route path='/livreur/clients' element={<RegisterClient />} />
                  <Route path='/livreur/orders' element={<CreateOrder />} />
                  <Route path='/livreur/delivery' element={<ReadyForDelivery />} />
                  <Route path='/livreur/delivery/:id' element={<DeliveryDetails />} />
                  <Route path='/livreur/canceled' element={<CanceledDeliveries />} />
                </Route>

                <Route element={<RequireAuth allowedRoles={["employe"]} />}>
                  {/* Employe Dashboard */}
                  <Route path='/employe/dashboard' element={<EmployeDashboard />} />

                  {/* Commande Detail */}
                  <Route path='/employe/commandes/:id' element={<CommandeDetail />} />

                  {/* Returned Orders */}
                  <Route path='/employe/retours' element={<ReturnedOrders />} />
                </Route>
              </Route>
            </Route>
            {/* 404 Catch-all */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer
          position={window.innerWidth < 640 ? "top-center" : "bottom-right"}
          autoClose={2000}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="custom-toast-pill"
          closeButton={false}
        />
      </Provider>
    </>
  )
}

export default App

