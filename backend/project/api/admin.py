from django.contrib import admin
from .models import User, Child, Club, ChildClub

admin.site.register(User)
admin.site.register(Child)
admin.site.register(Club)
admin.site.register(ChildClub)
