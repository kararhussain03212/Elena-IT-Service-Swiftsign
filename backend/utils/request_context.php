<?php
class RequestContext
{
    private static ?array $authenticatedUser = null;

    public static function setUser(array $user): void
    {
        self::$authenticatedUser = $user;
    }

    public static function getUser(): ?array
    {
        return self::$authenticatedUser;
    }
}
