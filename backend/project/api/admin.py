from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Category, Coach, Club, Child, Enrollment,
    Lesson, ContactMessage, ClubPost, RecommendationLog
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_staff']
    list_filter = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['email']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('age', 'bio', 'avatar', 'interests')}),
        ('Preferences', {'fields': ('preferred_categories', 'preferred_schedule')}),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('email', 'age', 'bio')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'color']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ['name', 'rating', 'students_count', 'experience', 'specialization', 'is_active']
    list_filter = ['is_active', 'specialization']
    search_fields = ['name', 'bio']
    list_editable = ['is_active']


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'day', 'time', 'capacity', 'rating', 'featured', 'is_active']
    list_filter = ['category', 'featured', 'is_active']
    search_fields = ['title', 'description', 'location']
    list_editable = ['featured', 'is_active']
    filter_horizontal = ['coaches']

    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'category', 'location')
        }),
        ('Schedule', {
            'fields': ('day', 'time')
        }),
        ('Visual', {
            'fields': ('icon', 'color', 'image')
        }),
        ('Details', {
            'fields': ('capacity', 'age_range', 'min_age', 'max_age', 'rating', 'featured')
        }),
        ('Staff', {
            'fields': ('coaches',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'age', 'avatar']
    list_filter = ['age']
    search_fields = ['name', 'parent__email']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'club', 'coach', 'child', 'enrollment_date', 'status']
    list_filter = ['status', 'enrollment_date', 'club']
    search_fields = ['user__email', 'club__title', 'child__name']
    date_hierarchy = 'enrollment_date'


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['club', 'coach', 'title', 'date', 'start_time', 'end_time']
    list_filter = ['club', 'date']
    search_fields = ['title', 'club__title']
    date_hierarchy = 'date'


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['subject', 'name', 'email', 'created_at', 'is_read']
    list_filter = ['is_read', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    date_hierarchy = 'created_at'
    list_editable = ['is_read']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = "Mark selected as read"

    actions = ['mark_as_read']


@admin.register(ClubPost)
class ClubPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'club', 'author', 'created_at', 'is_published']
    list_filter = ['is_published', 'club', 'created_at']
    search_fields = ['title', 'content']
    date_hierarchy = 'created_at'
    list_editable = ['is_published']


@admin.register(RecommendationLog)
class RecommendationLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'child', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email']
    date_hierarchy = 'created_at'
    readonly_fields = ['user', 'child', 'recommended_clubs', 'user_preferences', 'created_at']
