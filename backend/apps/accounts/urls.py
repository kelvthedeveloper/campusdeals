from django.urls import path

from .views import (
    AnalyticsSummaryView,
    LoginView,
    MeView,
    PasswordChangeView,
    PlatformSettingsView,
    ProfileView,
    RefreshView,
    RegisterView,
    UserAdminDetailView,
    UserAdminListCreateView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', RefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('settings/', PlatformSettingsView.as_view()),
    path('password/change/', PasswordChangeView.as_view()),
    path('analytics/summary/', AnalyticsSummaryView.as_view()),
    path('users/', UserAdminListCreateView.as_view()),
    path('users/<int:user_id>/', UserAdminDetailView.as_view()),
]
