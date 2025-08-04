import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Clock, Star, Zap, ShoppingBag, Heart, TrendingUp, Award } from 'lucide-react';

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return { text: 'Good Morning!', emoji: '🌅', color: 'from-amber-400 to-orange-500' };
    if (hour < 17) return { text: 'Good Afternoon!', emoji: '☀️', color: 'from-orange-400 to-red-500' };
    return { text: 'Good Evening!', emoji: '🌙', color: 'from-purple-400 to-pink-500' };
  };

  const greeting = getGreeting();

  const quickActions = [
    {
      title: 'Browse Menu',
      subtitle: 'Fresh & Delicious',
      icon: ChefHat,
      color: 'from-green-400 to-emerald-500',
      link: '/menu',
      delay: 'delay-100'
    },
    {
      title: 'Quick Order',
      subtitle: 'Popular Items',
      icon: Zap,
      color: 'from-yellow-400 to-orange-500',
      link: '/menu?filter=popular',
      delay: 'delay-200'
    },
    {
      title: 'My Orders',
      subtitle: 'Track & History',
      icon: ShoppingBag,
      color: 'from-blue-400 to-indigo-500',
      link: '/orders',
      delay: 'delay-300'
    },
    {
      title: 'Favorites',
      subtitle: 'Your Picks',
      icon: Heart,
      color: 'from-pink-400 to-rose-500',
      link: '/favorites',
      delay: 'delay-400'
    }
  ];

  const stats = [
    { label: 'Happy Students', value: '2.5K+', icon: Star },
    { label: 'Orders Today', value: '150+', icon: TrendingUp },
    { label: 'Avg Rating', value: '4.8', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section */}
      <div className={`px-4 pt-8 pb-6 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        {/* Greeting Card */}
        <div className={`bg-gradient-to-r ${greeting.color} rounded-3xl p-6 mb-6 text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">{greeting.emoji}</span>
                <h1 className="text-xl font-bold">{greeting.text}</h1>
              </div>
              <p className="text-white/90 text-sm">
                Ready for something delicious?
              </p>
            </div>
            <div className="text-right">
              <div className="text-white/90 text-xs">
                {currentTime.toLocaleDateString()}
              </div>
              <div className="text-lg font-mono font-bold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            College Canteen
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Fresh meals, quick delivery, happy students ✨
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Zap className="h-5 w-5 text-orange-500 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              to={action.link}
              className={`group transform transition-all duration-500 hover:scale-105 ${action.delay} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
            >
              <div className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl border border-gray-100 hover:border-orange-200 transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-600">
                  {action.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
            Why Students Love Us
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center group">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="px-4 mb-8">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">
                Today's Special
              </h3>
              <p className="text-white/90 text-sm mb-3">
                Fresh biryani with 20% off!
              </p>
              <Link
                to="/menu?special=today"
                className="inline-flex items-center bg-white text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors duration-200"
              >
                Order Now
                <ChefHat className="h-4 w-4 ml-2" />
              </Link>
            </div>
            <div className="text-6xl opacity-20">
              🍛
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-gray-800">Fast Delivery</span>
            </div>
            <p className="text-xs text-gray-600">
              Average 15 mins to your location
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-800">Quality Food</span>
            </div>
            <p className="text-xs text-gray-600">
              Fresh ingredients, made daily
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;