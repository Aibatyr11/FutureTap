from django.contrib import admin
from .models import User, Child, Club, ChildClub, ClubPost

admin.site.register(User)
admin.site.register(Child)
admin.site.register(Club)
admin.site.register(ChildClub)
admin.site.register(ClubPost)
