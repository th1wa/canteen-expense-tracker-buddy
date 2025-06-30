
# 🍽️ Canteen Buddy

A comprehensive canteen management system built for tracking expenses, managing payments, and streamlining food service operations.

## ✨ Features

### 🔐 Multi-Role Authentication
- **Admin**: Full system access and user management
- **HR**: User oversight and reporting capabilities  
- **Canteen**: Order management and payment processing
- **User**: Expense tracking and payment history

### 💰 Expense Management
- Real-time expense tracking and recording
- Comprehensive payment history with filtering
- Outstanding balance calculations
- CSV import/export functionality
- Automated backup systems

### 📊 Analytics & Reporting  
- Interactive dashboard with charts and statistics
- User activity monitoring
- Payment summaries and trends
- Excel/PDF report generation
- Data visualization with Recharts

### 🎨 Modern UI/UX
- Fully responsive design for all devices (mobile, tablet, desktop)
- Dark/light theme support
- Clean, intuitive interface built with shadcn/ui
- Mobile-first responsive design
- Touch-friendly controls

### ⚡ Technical Features
- Real-time data synchronization
- Offline-capable design
- Advanced filtering and search
- Google Drive backup integration
- Row-level security (RLS) for data protection

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **State Management**: TanStack React Query
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **File Processing**: ExcelJS, jsPDF, PapaParse

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd canteen-buddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Responsive Design

Canteen Buddy is fully responsive and optimized for:

- 📱 **Mobile phones** (320px - 768px)
- 📱 **Tablets** (768px - 1024px)  
- 💻 **Laptops** (1024px - 1440px)
- 🖥️ **Desktop monitors** (1440px+)
- 📺 **Ultra-wide displays** (1920px+)

## 🔒 Security Features

- Row-level security (RLS) policies
- Role-based access control (RBAC)
- Secure authentication with Supabase Auth
- Data encryption at rest and in transit
- Input validation and sanitization

## 📈 Key Metrics Dashboard

- Total users and active accounts
- Daily/monthly expense trends
- Payment completion rates
- Outstanding balances overview
- User activity analytics

---

## 📋 Changelog

### Recent Updates & Improvements

#### 🎨 **UI/UX Enhancements**
- ✅ **Full responsive design** - Optimized for all screen sizes from mobile to ultra-wide displays
- ✅ **Mobile-first approach** - Touch-friendly controls and gesture support
- ✅ **Adaptive typography** - Dynamic text sizing based on screen size
- ✅ **Smart content hiding** - Progressive disclosure for smaller screens
- ✅ **Improved spacing** - Consistent padding and margins across devices
- ✅ **Flexible layouts** - Grid and flexbox optimizations for all viewports

#### 🔧 **Technical Improvements**
- ✅ **TypeScript error fixes** - Resolved missing icon imports and type conflicts
- ✅ **Component optimization** - Better prop handling and state management
- ✅ **Performance enhancements** - Reduced bundle size and faster load times
- ✅ **Code organization** - Modular component structure for maintainability

#### 📊 **Feature Additions**
- ✅ **Enhanced payment modal** - Improved user experience with better validation
- ✅ **Advanced filtering** - Multi-criteria search and filter options
- ✅ **Real-time updates** - Live data synchronization across sessions
- ✅ **Export capabilities** - CSV/Excel export with formatting options

#### 🛡️ **Security & Reliability**
- ✅ **RLS policies** - Comprehensive row-level security implementation
- ✅ **Input validation** - Client and server-side data validation
- ✅ **Error handling** - Graceful error recovery and user feedback
- ✅ **Backup systems** - Automated data backup and recovery

#### 🔄 **Database & Backend**
- ✅ **Optimized queries** - Improved database performance
- ✅ **Migration scripts** - Seamless database updates
- ✅ **Edge functions** - Serverless backend functionality
- ✅ **Real-time subscriptions** - Live data updates

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with POS systems
- [ ] Inventory management module
- [ ] Multi-language support
- [ ] WhatsApp/SMS notifications

## 📞 Support

For support and questions:
- 📧 Email: support@canteenbuddy.com
- 💬 Discord: [Join our community](https://discord.gg/canteenbuddy)
- 📖 Documentation: [docs.canteenbuddy.com](https://docs.canteenbuddy.com)

---

<div align="center">
  <p>Made with ❤️ for better canteen management</p>
  <p>
    <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React 18">
    <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Supabase-green?logo=supabase" alt="Supabase">
  </p>
</div>
